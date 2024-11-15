from flask import Blueprint, jsonify
from sqlalchemy import func, case, extract, text
from flask_jwt_extended import jwt_required,get_jwt_identity
from datetime import datetime, timedelta
from app.models.test import Test, TestSession, QuestionResponse
from app.models.user import User 
from app.extensions import db
dashboard_routes = Blueprint('dashboard_routes', __name__)

@dashboard_routes.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
  try:
      current_user_id = get_jwt_identity()
      user = User.query.get(current_user_id)
      
      if not user:
          return jsonify({"error": "User not found"}), 404

      if user.role == 'admin':
          
          return get_admin_stats()
      else:
          return get_user_stats(current_user_id)
  except Exception as e:
      print(f"Error fetching dashboard stats: {str(e)}")
      return jsonify({"error": "Failed to fetch dashboard statistics"}), 500

def get_admin_stats():
  try:
      # Get current timestamp and 24 hours ago
      now = datetime.utcnow()
      twenty_four_hours_ago = now - timedelta(hours=24)

      # Calculate all admin statistics
      stats = db.session.execute(text("""
          WITH stats AS (
              SELECT 
                  COUNT(DISTINCT u.id) as total_users,
                  COUNT(DISTINCT t.id) as total_tests,
                  COUNT(DISTINCT ts.id) as total_attempts,
                  AVG(ts.score) as average_score,
                  SUM(CASE WHEN ts.passed = true THEN 1 ELSE 0 END)::float / 
                      NULLIF(COUNT(ts.id), 0) * 100 as pass_rate,
                  COUNT(DISTINCT CASE 
                      WHEN ts.start_time >= :twenty_four_hours_ago THEN ts.id 
                      END) as recent_attempts,
                  MAX(ts.score) as highest_score,
                  AVG(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/60) as avg_duration
              FROM users u
              LEFT JOIN test_sessions ts ON u.id = ts.user_id
              LEFT JOIN tests t ON ts.test_id = t.id
              WHERE ts.status = 'completed'
          )
          SELECT 
              total_users,
              total_tests,
              total_attempts,
              ROUND(COALESCE(average_score, 0)::numeric, 2) as average_score,
              ROUND(COALESCE(pass_rate, 0)::numeric, 2) as pass_rate,
              recent_attempts,
              ROUND(COALESCE(highest_score, 0)::numeric, 2) as highest_score,
              ROUND(COALESCE(avg_duration, 0)::numeric, 2) as average_test_duration
          FROM stats
      """), {
          "twenty_four_hours_ago": twenty_four_hours_ago
      }).fetchone()

      return jsonify({
          "totalUsers": stats.total_users,
          "totalTests": stats.total_tests,
          "totalAttempts": stats.total_attempts,
          "averageScore": float(stats.average_score),
          "passRate": float(stats.pass_rate),
          "recentTestAttempts": stats.recent_attempts,
          "highestScore": float(stats.highest_score),
          "averageTestDuration": float(stats.average_test_duration)
      })

  except Exception as e:
      print(f"Error in admin stats: {str(e)}")
      return jsonify({"error": "Failed to fetch admin statistics"}), 500

def get_user_stats(user_id):
  try:
      # Get current timestamp and previous month
      now = datetime.utcnow()
      last_month = now - timedelta(days=30)

      # Calculate user statistics
      stats = db.session.execute(text("""
          WITH user_stats AS (
              SELECT 
                  COUNT(DISTINCT ts.id) as tests_attempted,
                  COUNT(DISTINCT CASE WHEN ts.status = 'completed' THEN ts.id END) as tests_completed,
                  AVG(CASE WHEN ts.status = 'completed' THEN ts.score ELSE NULL END) as avg_score,
                  MAX(ts.score) as best_score,
                  MAX(ts.end_time) as last_attempt_date,
                  SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/60) as total_time,
                  COUNT(DISTINCT CASE WHEN ts.passed = true THEN ts.id END) as passed_tests,
                  (
                      SELECT COUNT(*)
                      FROM (
                          SELECT ts2.passed
                          FROM test_sessions ts2
                          WHERE ts2.user_id = :user_id
                          AND ts2.status = 'completed'
                          ORDER BY ts2.end_time DESC
                          LIMIT 5
                      ) recent
                      WHERE passed = true
                  ) as current_streak,
                  (
                      SELECT COUNT(*)
                      FROM tests t
                      WHERE t.is_active = true
                      AND t.id NOT IN (
                          SELECT test_id 
                          FROM test_sessions 
                          WHERE user_id = :user_id
                          AND status = 'completed'
                      )
                  ) as upcoming_tests,
                  (
                      SELECT COUNT(*) + 1
                      FROM (
                          SELECT DISTINCT user_id, AVG(score) as avg_score
                          FROM test_sessions
                          WHERE status = 'completed'
                          GROUP BY user_id
                          HAVING AVG(score) > (
                              SELECT AVG(score)
                              FROM test_sessions
                              WHERE user_id = :user_id
                              AND status = 'completed'
                          )
                      ) better_scores
                  ) as rank,
                  (
                      SELECT COALESCE(
                          (
                              SELECT AVG(score) - (
                                  SELECT AVG(score)
                                  FROM test_sessions
                                  WHERE user_id = :user_id
                                  AND status = 'completed'
                                  AND end_time < :last_month
                              )
                              FROM test_sessions
                              WHERE user_id = :user_id
                              AND status = 'completed'
                              AND end_time >= :last_month
                          ), 0
                      )
                  ) as improvement
              FROM test_sessions ts
              WHERE ts.user_id = :user_id
          )
          SELECT 
              tests_attempted,
              tests_completed,
              ROUND(COALESCE(avg_score, 0)::numeric, 2) as average_score,
              ROUND(COALESCE(best_score, 0)::numeric, 2) as best_score,
              last_attempt_date,
              upcoming_tests,
              ROUND(COALESCE(total_time, 0)::numeric, 2) as time_spent,
              passed_tests,
              current_streak,
              rank,
              ROUND(COALESCE(improvement, 0)::numeric, 2) as improvement
          FROM user_stats
      """), {
          "user_id": user_id,
          "last_month": last_month
      }).fetchone()

      # Calculate total points (example: 10 points per passed test + bonus points for high scores)
      total_points = db.session.execute(text("""
          SELECT COALESCE(
              SUM(
                  CASE 
                      WHEN passed = true THEN 10 
                      ELSE 0 
                  END +
                  CASE 
                      WHEN score >= 90 THEN 5
                      WHEN score >= 80 THEN 3
                      WHEN score >= 70 THEN 1
                      ELSE 0
                  END
              ), 0
          ) as total_points
          FROM test_sessions
          WHERE user_id = :user_id
          AND status = 'completed'
      """), {
          "user_id": user_id
      }).scalar()

      return jsonify({
          "testsAttempted": stats.tests_attempted,
          "testsCompleted": stats.tests_completed,
          "averageUserScore": float(stats.average_score),
          "bestScore": float(stats.best_score),
          "lastAttemptDate": stats.last_attempt_date.isoformat() if stats.last_attempt_date else None,
          "upcomingTests": stats.upcoming_tests,
          "timeSpentTotal": float(stats.time_spent),
          "passedTests": stats.passed_tests,
          "currentStreak": stats.current_streak,
          "totalPoints": int(total_points),
          "rank": stats.rank,
          "improvement": float(stats.improvement)
      })

  except Exception as e:
      print(f"Error in user stats: {str(e)}")
      return jsonify({"error": "Failed to fetch user statistics"}), 500