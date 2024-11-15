from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, desc, case
from app.models.test import Test, TestSession
from app.models.user import User
from app.extensions import db

leaderboard_routes = Blueprint('leaderboard_routes', __name__)

@leaderboard_routes.route('/list', methods=['GET'])
@jwt_required()
def get_leaderboard():
  try:
      # Subquery to get each user's best performance
      user_stats = db.session.query(
          TestSession.user_id,
          User.first_name,
          User.last_name,
          User.email,
          func.count(TestSession.id).label('total_tests_taken'),
          func.avg(TestSession.score).label('average_score'),
          func.sum(
              case(
                  (TestSession.score >= Test.passing_score, 1),
                  else_=0
              )
          ).label('tests_passed'),
          func.max(TestSession.score).label('highest_score')
      ).join(
          User, User.id == TestSession.user_id
      ).join(
          Test, Test.id == TestSession.test_id
      ).filter(
          TestSession.status == 'completed'
      ).group_by(
          TestSession.user_id,
          User.first_name,
          User.last_name,
          User.email
      ).order_by(
          desc('average_score'),
          desc('tests_passed'),
          desc('highest_score')
      ).limit(100).all()

      if not user_stats:
          return jsonify({
              'leaderboard': [],
              'message': 'No completed tests found'
          }), 200

      leaderboard = []
      for rank, stats in enumerate(user_stats, 1):
          try:
              # Handle potential None values
              average_score = stats.average_score or 0
              highest_score = stats.highest_score or 0
              
              leaderboard.append({
                  'rank': rank,
                  'user_id': stats.user_id,
                  'name': f"{stats.first_name or ''} {stats.last_name or ''}".strip(),
                  'email': stats.email,
                  'stats': {
                      'total_tests': stats.total_tests_taken,
                      'average_score': round(float(average_score), 2),
                      'tests_passed': int(stats.tests_passed or 0),
                      'highest_score': float(highest_score)
                  }
              })
          except Exception as e:
              print(f"Error processing user stats: {e}")
              continue

      return jsonify({
          'leaderboard': leaderboard,
          'total_users': len(leaderboard)
      })

  except Exception as e:
      print(f"Error in get_leaderboard: {e}")
      return jsonify({
          'error': 'An error occurred while fetching the leaderboard',
          'message': str(e)
      }), 500