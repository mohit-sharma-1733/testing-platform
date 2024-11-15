from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
import google.generativeai as genai
from app.models.test import QuestionResponse, ResponseOption, Test, Question, QuestionOption, QuestionType, TestSession
import json
import logging
from sqlalchemy import and_
import os
test_routes = Blueprint('test_routes', __name__)
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

def generate_questions_prompt(topic, num_questions=10):
  prompt = f"""
  Generate {num_questions} questions about {topic} in the following JSON format:
  {{
      "questions": [
          {{
              "question_text": "Question text here",
              "question_type": "single_mcq|multiple_mcq|fill_blank|yes_no",
              "options": [
                  {{"text": "Option 1", "is_correct": true}},
                  {{"text": "Option 2", "is_correct": false}},
                  {{"text": "Option 3", "is_correct": false}},
                  {{"text": "Option 4", "is_correct": false}}
              ],
              "explanation": "Explanation for the correct answer",
              "points": 1.0
          }}
      ]
  }}
  
  Rules:
  1. For single_mcq, only one option should be correct
  2. For multiple_mcq, multiple options can be correct
  3. For fill_blank, provide one correct answer in the options
  4. For yes_no, provide only two options: Yes and No
  5. Ensure questions are diverse and cover different aspects of the topic
  6. Provide clear explanations for each correct answer
  """
  return prompt
def clean_ai_response(response_text):
    """Clean the AI response to ensure valid JSON
    
    Args:
        response_text (str): The raw response text from the AI
        
    Returns:
        str: Cleaned JSON string
        
    Raises:
        ValueError: If the cleaned text is not valid JSON format
    """
    # Remove any markdown code block formatting
    clean_text = response_text.replace("```json", "").replace("```", "")
    
    # Remove any leading/trailing whitespace or newlines
    clean_text = clean_text.strip()
    
    # Try to find JSON content between { and }
    start_idx = clean_text.find("{")
    end_idx = clean_text.rfind("}")
    
    if start_idx == -1 or end_idx == -1:
        raise ValueError("No JSON object found in AI response")
        
    # Extract just the JSON portion
    clean_text = clean_text[start_idx:end_idx + 1]
    
    # Basic JSON format validation
    if not (clean_text.startswith("{") and clean_text.endswith("}")):
        raise ValueError("Invalid JSON format in AI response")
        
    return clean_text
@test_routes.route('/create', methods=['POST'], endpoint='create_test')
@jwt_required()
def create_test():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'topic', 'duration_minutes', 'passing_score']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Generate questions using Gemini
        try:
            prompt = generate_questions_prompt(data['topic'], data.get('num_questions', 10))
            response = model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("Empty response from AI")
            
            # Clean and parse the response
            clean_response = clean_ai_response(response.text)
            questions_data = json.loads(clean_response)
            
            if not questions_data.get('questions'):
                raise ValueError("No questions generated")
            
        except Exception as e:
            logger.error(f"AI Generation Error: {str(e)}")
            return jsonify({'error': 'Failed to generate questions. Please try again.'}), 500

        # Create test
        test = Test(
            title=data['title'],
            description=data.get('description', ''),
            duration_minutes=int(data['duration_minutes']),
            passing_score=float(data['passing_score']),
            creator_id=current_user_id,
            #is_randomized=data.get('is_randomized', False),
           # allow_review=data.get('allow_review', True)
        )
        
        db.session.add(test)
        db.session.flush()  # Get test ID without committing

        # Create questions and options
        for idx, q_data in enumerate(questions_data['questions'], 1):
            try:
                question = Question(
                    test_id=test.id,
                    question_text=q_data['question_text'],
                    question_type=QuestionType[q_data['question_type'].upper()],
                    points=float(q_data['points']),
                    order=idx,
                    explanation=q_data.get('explanation', '')
                )
                db.session.add(question)
                db.session.flush()

                # Add options
                for opt_idx, opt_data in enumerate(q_data['options'], 1):
                    option = QuestionOption(
                        question_id=question.id,
                        option_text=opt_data['text'],
                        is_correct=bool(opt_data['is_correct']),
                        order=opt_idx
                    )
                    db.session.add(option)
                
            except KeyError as e:
                raise ValueError(f"Invalid question data format: missing {str(e)}")
            except Exception as e:
                raise ValueError(f"Error processing question {idx}: {str(e)}")

        db.session.commit()
        return jsonify({
            'message': 'Test created successfully',
            'test_id': test.id
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Test Creation Error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@test_routes.route('/delete/<test_id>', methods=['DELETE'])
@jwt_required()
def delete_test(test_id):
  try:
      # Get current user
      current_user_id = get_jwt_identity()
      user = User.query.get(current_user_id)

      # Check if user is admin
      if not user.role == "admin":
          return jsonify({'error': 'Unauthorized'}), 403

      # Find the test
      test = Test.query.get_or_404(test_id)

      # Delete associated records first (maintain referential integrity)
      # Delete question responses
      QuestionResponse.query.filter(
          QuestionResponse.session_id.in_(
              TestSession.query.with_entities(TestSession.id)
              .filter_by(test_id=test.id)
          )
      ).delete(synchronize_session=False)

      # Delete response options
      ResponseOption.query.filter(
          ResponseOption.response_id.in_(
              QuestionResponse.query.with_entities(QuestionResponse.id)
              .filter(
                  QuestionResponse.session_id.in_(
                      TestSession.query.with_entities(TestSession.id)
                      .filter_by(test_id=test.id)
                  )
              )
          )
      ).delete(synchronize_session=False)

      # Delete test sessions
      TestSession.query.filter_by(test_id=test.id).delete()

      # Delete question options
      QuestionOption.query.filter(
          QuestionOption.question_id.in_(
              Question.query.with_entities(Question.id)
              .filter_by(test_id=test.id)
          )
      ).delete(synchronize_session=False)

      # Delete questions
      Question.query.filter_by(test_id=test.id).delete()

      # Finally, delete the test
      db.session.delete(test)
      db.session.commit()

      return jsonify({'message': 'Test deleted successfully'}), 200

  except Exception as e:
      db.session.rollback()
      print(f"Error deleting test: {str(e)}")
      return jsonify({'error': 'Failed to delete test'}), 500
@test_routes.route('/<int:test_id>', methods=['GET'], endpoint='get_test')
@jwt_required()
def get_test(test_id):
  test = Test.query.get_or_404(test_id)
  
  questions = []
  for question in test.questions:
      options = [
          {
              'id': option.id,
              'text': option.option_text,
              'is_correct': option.is_correct
          } for option in question.options
      ]
      
      questions.append({
          'id': question.id,
          'question_text': question.question_text,
          'question_type': question.question_type.value,
          'points': question.points,
          'order': question.order,
          'explanation': question.explanation,
          'options': options
      })
  
  return jsonify({
      'id': test.id,
      'title': test.title,
      'description': test.description,
      'duration_minutes': test.duration_minutes,
      'passing_score': test.passing_score,
      'created_at': test.created_at,
      'questions': questions
  })

@test_routes.route('/list', methods=['GET'], endpoint='list_tests')
@jwt_required()
def list_tests():
  try:
      current_user_id = get_jwt_identity()
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      
      tests = Test.query.order_by(Test.created_at.desc()).paginate(
          page=page, per_page=per_page
      )
      
      # Get all test sessions for the current user in one query
      test_sessions = {
          session.test_id: session
          for session in TestSession.query.filter(
              TestSession.user_id == current_user_id,
              TestSession.test_id.in_([test.id for test in tests.items])
          ).all()
      }
      
      test_list = []
      for test in tests.items:
          session = test_sessions.get(test.id)
          
          # Determine test status
          status = 'not_started'
          last_score = None
          last_attempt_date = None
          session_id = None
          remaining_time = None
          
          if session:
              session_id = session.id
              if session.status == 'completed':
                  status = 'completed'
                  last_score = session.score
              elif session.status == 'in_progress':
                  status = 'in_progress'
                  # Calculate remaining time if in progress
                  if session.end_time:
                      remaining_time = (session.end_time - datetime.utcnow()).total_seconds()
                      remaining_time = max(0, int(remaining_time))  # Ensure non-negative
              
              last_attempt_date = session.start_time.isoformat() if session.start_time else None
          
          test_data = {
              'id': test.id,
              'title': test.title,
              'description': test.description,
              'duration_minutes': test.duration_minutes,
              'passing_score': test.passing_score,
              'created_at': test.created_at,
              'question_count': len(test.questions),
              'status': status,
              'last_score': last_score,
              'last_attempt_date': last_attempt_date,
              'session_id': session_id,
              'remaining_time': remaining_time  # Include remaining time for in-progress tests
          }
          test_list.append(test_data)
      
      return jsonify({
          'tests': test_list,
          'total': tests.total,
          'pages': tests.pages,
          'current_page': tests.page
      })
      
  except Exception as e:
      logger.error(f"Error in list_tests: {str(e)}")
      return jsonify({'error': 'Failed to fetch tests'}), 500

@test_routes.route('/<int:test_id>/questions', methods=['GET'])
@jwt_required()
def get_test_questions(test_id):
  try:
      current_user_id = get_jwt_identity()
      test = Test.query.get_or_404(test_id)
      
      # Check for active session
      active_session = TestSession.query.filter(
          and_(
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'in_progress'
          )
      ).first()

      # Get or create session
      if not active_session:
          active_session = TestSession(
              test_id=test_id,
              user_id=current_user_id,
              start_time=datetime.utcnow(),
              status='in_progress',
              remaining_time=test.duration_minutes * 60,
              current_question_index=0
          )
          db.session.add(active_session)
          db.session.commit()

      # Get questions
      questions = Question.query.filter_by(test_id=test_id).order_by(Question.order).all()
      
      # Get saved answers
      saved_answers = {}
      if active_session:
          responses = QuestionResponse.query.filter_by(session_id=active_session.id).all()
          for response in responses:
              if response.text_response:
                  saved_answers[response.question_id] = response.text_response
              else:
                  selected_options = [opt.option_id for opt in response.selected_options]
                  if len(selected_options) == 1:
                      saved_answers[response.question_id] = selected_options[0]
                  else:
                      saved_answers[response.question_id] = selected_options

      # Format questions
      questions_data = []
      for question in questions:
          question_data = {
              'id': question.id,
              'question_text': question.question_text,
              'question_type': question.question_type.value,
              'points': question.points,
              'order': question.order,
              'explanation': question.explanation,
              'options': []
          }
          
          if question.question_type in [QuestionType.SINGLE_MCQ, QuestionType.MULTIPLE_MCQ, QuestionType.YES_NO]:
              options = QuestionOption.query.filter_by(question_id=question.id).order_by(QuestionOption.order).all()
              question_data['options'] = [
                  {
                      'id': opt.id,
                      'text': opt.option_text,
                      'is_correct': opt.is_correct
                  }
                  for opt in options
              ]
          
          questions_data.append(question_data)

      return jsonify({
          'questions': questions_data,
          'session_id': active_session.id,
          'current_question_index': active_session.current_question_index,
          'remaining_time': active_session.remaining_time,
          'saved_answers': saved_answers
      }), 200

  except Exception as e:
      logger.error(f"Error fetching test questions: {str(e)}")
      return jsonify({'error': 'Failed to fetch test questions'}), 500


@test_routes.route('/<int:test_id>/progress', methods=['POST'])
@jwt_required()
def update_progress(test_id):
  try:
      current_user_id = get_jwt_identity()
      data = request.get_json()
      
      session = TestSession.query.filter(
          and_(
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'in_progress'
          )
      ).first()

      if not session:
          return jsonify({'error': 'No active session found'}), 404

      # Update session
      session.remaining_time = data['remaining_time']
      session.current_question_index = data['current_question_index']
      
      # Save answers
      for question_id, answer in data['answers'].items():
          question_id = int(question_id)
          
          # Get or create response
          response = QuestionResponse.query.filter_by(
              session_id=session.id,
              question_id=question_id
          ).first()
          
          if not response:
              response = QuestionResponse(
                  session_id=session.id,
                  question_id=question_id
              )
              db.session.add(response)
              db.session.flush()

          # Clear existing options
          ResponseOption.query.filter_by(response_id=response.id).delete()

          # Save new response
          if isinstance(answer, list):
              for option_id in answer:
                  option = ResponseOption(
                      response_id=response.id,
                      option_id=option_id
                  )
                  db.session.add(option)
          elif isinstance(answer, str):
              response.text_response = answer
          else:
              option = ResponseOption(
                  response_id=response.id,
                  option_id=answer
              )
              db.session.add(option)

      db.session.commit()
      return jsonify({'message': 'Progress saved successfully'}), 200

  except Exception as e:
      db.session.rollback()
      logger.error(f"Error updating progress: {str(e)}")
      return jsonify({'error': f'Failed to update progress: {str(e)}'}), 500






@test_routes.route('/<int:test_id>/submit', methods=['POST'])
@jwt_required()
def submit_test(test_id):
  """Submit test answers and calculate score"""
  try:
      data = request.get_json()
      answers = data.get('answers', {})
      time_spent = data.get('timeSpent', 0)
      current_user_id = get_jwt_identity()

      # Get active session
      session = TestSession.query.filter(
          and_(
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'in_progress'
          )
      ).first()

      if not session:
          return jsonify({'error': 'No active test session found'}), 404

      # Get test details
      test = Test.query.get_or_404(test_id)
      
      # Calculate score
      total_points = 0
      earned_points = 0

      for question_id, answer in answers.items():
          question = Question.query.get(int(question_id))
          if not question:
              continue

          # Create question response
          response = QuestionResponse(
              session_id=session.id,
              question_id=int(question_id)
          )
          db.session.add(response)
          db.session.flush()  # Get response ID

          if question.question_type == QuestionType.FILL_BLANK:
              response.text_response = answer
              # Text responses need manual grading
              response.is_correct = None
          else:
              correct_options = set(
                  opt.id for opt in QuestionOption.query.filter_by(
                      question_id=question_id, 
                      is_correct=True
                  ).all()
              )
              
              if question.question_type in [QuestionType.SINGLE_MCQ, QuestionType.YES_NO]:
                  is_correct = int(answer) in correct_options
                  response.is_correct = is_correct
                  if answer:
                      response_option = ResponseOption(
                          response_id=response.id,
                          option_id=int(answer)
                      )
                      db.session.add(response_option)
              
              elif question.question_type == QuestionType.MULTIPLE_MCQ:
                  selected_options = set(int(opt) for opt in (answer if isinstance(answer, list) else []))
                  is_correct = selected_options == correct_options
                  response.is_correct = is_correct
                  for option_id in selected_options:
                      response_option = ResponseOption(
                          response_id=response.id,
                          option_id=option_id
                      )
                      db.session.add(response_option)

          total_points += question.points
          if response.is_correct:
              earned_points += question.points

      # Calculate score percentage
      score_percentage = (earned_points / total_points * 100) if total_points > 0 else 0
      
      # Update session
      session.end_time = datetime.utcnow()
      session.score = score_percentage
      session.time_spent = time_spent
      session.status = 'completed'
      session.passed = score_percentage >= test.passing_score

      db.session.commit()

      return jsonify({
          'session_id': session.id,
          'score': score_percentage,
          'passed': session.passed,
          'total_points': total_points,
          'earned_points': earned_points,
          'time_spent': time_spent
      }), 200

  except Exception as e:
      db.session.rollback()
      logger.error(f"Error submitting test: {str(e)}")
      return jsonify({'error': 'Failed to submit test'}), 500

@test_routes.route('/<int:test_id>/session/status', methods=['GET'], endpoint='get_session_status')
@jwt_required()
def get_session_status(test_id):
  """Get current test session status"""
  try:
      current_user_id = get_jwt_identity()
      session = TestSession.query.filter(
          and_(
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'in_progress'
          )
      ).first()

      if not session:
          return jsonify({'status': 'no_active_session'}), 200

      return jsonify({
          'session_id': session.id,
          'status': session.status,
          'remaining_time': session.remaining_time,
          'start_time': session.start_time.isoformat()
      }), 200

  except Exception as e:
      logger.error(f"Error fetching session status: {str(e)}")
      return jsonify({'error': 'Failed to fetch session status'}), 500


@test_routes.route('/<int:test_id>/results/<int:session_id>', methods=['GET'])
@jwt_required()
def get_test_results(test_id, session_id):
  """Get detailed test results for a specific session"""
  try:
      current_user_id = get_jwt_identity()
      
      # Get session with validation
      session = TestSession.query.filter(
          and_(
              TestSession.id == session_id,
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'completed'
          )
      ).first()
      
      if not session:
          return jsonify({'error': 'Test session not found or not completed'}), 404

      # Get test details
      test = Test.query.get_or_404(test_id)
      
      # Get all questions with responses
      questions_with_responses = []
      total_points = 0
      earned_points = 0
      correct_count = 0
      incorrect_count = 0
      unanswered_count = 0
      
      for question in test.questions:
          response = QuestionResponse.query.filter_by(
              session_id=session_id,
              question_id=question.id
          ).first()
          
          question_data = {
              'id': question.id,
              'question_text': question.question_text,
              'question_type': question.question_type.value,
              'points': question.points,
              'explanation': question.explanation,
              'options': [],
              'user_answer': None,
              'is_correct': response.is_correct if response else None
          }
          
          # Get all options for the question
          options = QuestionOption.query.filter_by(question_id=question.id).all()
          has_answer = False
          
          # Add options with user's selection status
          for option in options:
              option_data = {
                  'id': option.id,
                  'text': option.option_text,
                  'is_correct': option.is_correct
              }
              
              if response:
                  if question.question_type == QuestionType.FILL_BLANK:
                      question_data['user_answer'] = response.text_response
                      has_answer = bool(response.text_response)
                  else:
                      # Check if this option was selected by user
                      selected = ResponseOption.query.filter_by(
                          response_id=response.id,
                          option_id=option.id
                      ).first() is not None
                      option_data['user_selected'] = selected
                      
                      if selected:
                          has_answer = True
                          if question.question_type in [QuestionType.SINGLE_MCQ, QuestionType.YES_NO]:
                              question_data['user_answer'] = option.id
                          elif question.question_type == QuestionType.MULTIPLE_MCQ:
                              if question_data['user_answer'] is None:
                                  question_data['user_answer'] = []
                              question_data['user_answer'].append(option.id)
              
              question_data['options'].append(option_data)
          
          # Update counts based on response
          if not has_answer:
              unanswered_count += 1
              question_data['is_correct'] = None
          elif response and response.is_correct:
              correct_count += 1
              earned_points += question.points
          else:
              incorrect_count += 1
          
          total_points += question.points
          questions_with_responses.append(question_data)

      # Calculate time taken
      time_taken = session.time_spent if session.time_spent is not None else (
          int((session.end_time - session.start_time).total_seconds())
          if session.end_time and session.start_time
          else None
      )

      # Calculate score percentage
      score_percentage = (earned_points / total_points * 100) if total_points > 0 else 0
      passed = score_percentage >= test.passing_score

      # Update session if needed
      if session.score != score_percentage or session.passed != passed:
          session.score = score_percentage
          session.passed = passed
          db.session.commit()

      # Prepare result summary
      result_summary = {
          'test_id': test.id,
          'test_title': test.title,
          'session_id': session.id,
          'start_time': session.start_time.isoformat(),
          'end_time': session.end_time.isoformat() if session.end_time else None,
          'time_taken': time_taken,
          'total_points': total_points,
          'earned_points': earned_points,
          'score_percentage': score_percentage,
          'passing_score': test.passing_score,
          'passed': passed,
          'questions': questions_with_responses,
          'total_questions': len(questions_with_responses),
          'correct_answers': correct_count,
          'incorrect_answers': incorrect_count,
          'unanswered': unanswered_count
      }

      return jsonify(result_summary), 200

  except Exception as e:
      logger.error(f"Error fetching test results: {str(e)}")
      return jsonify({'error': 'Failed to fetch test results'}), 500

@test_routes.route('/<int:test_id>/session/update-time', methods=['POST'], endpoint='update_session_time')
@jwt_required()
def update_session_time(test_id):
  """Update remaining time for test session"""
  try:
      data = request.get_json()
      remaining_time = data.get('remaining_time')
      current_user_id = get_jwt_identity()
      session = TestSession.query.filter(
          and_(
              TestSession.test_id == test_id,
              TestSession.user_id == current_user_id,
              TestSession.status == 'in_progress'
          )
      ).first()

      if not session:
          return jsonify({'error': 'No active session found'}), 404

      session.remaining_time = remaining_time
      db.session.commit()

      return jsonify({'success': True}), 200

  except Exception as e:
      db.session.rollback()
      logger.error(f"Error updating session time: {str(e)}")
      return jsonify({'error': 'Failed to update session time'}), 500