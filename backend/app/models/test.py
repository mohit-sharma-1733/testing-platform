from datetime import datetime
from app.extensions import db
from sqlalchemy.orm import relationship
from enum import Enum
class QuestionType(Enum):
  SINGLE_MCQ = 'single_mcq'
  MULTIPLE_MCQ = 'multiple_mcq'
  FILL_BLANK = 'fill_blank'
  YES_NO = 'yes_no'

class Test(db.Model):
  __tablename__ = 'tests'
  
  id = db.Column(db.Integer, primary_key=True)
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text)
  duration_minutes = db.Column(db.Integer)
  passing_score = db.Column(db.Float, default=70.0)
  is_active = db.Column(db.Boolean, default=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  creator_id = db.Column(db.Integer, db.ForeignKey('users.id'))
  
  creator = relationship('User', back_populates='created_tests')
  questions = relationship('Question', back_populates='test', cascade='all, delete-orphan')
  test_sessions = relationship('TestSession', back_populates='test')

class Question(db.Model):
  __tablename__ = 'questions'
  
  id = db.Column(db.Integer, primary_key=True)
  test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
  question_text = db.Column(db.Text, nullable=False)
  question_type = db.Column(db.Enum(QuestionType), nullable=False)
  points = db.Column(db.Float, default=1.0)
  order = db.Column(db.Integer)
  explanation = db.Column(db.Text)
  
  test = relationship('Test', back_populates='questions')
  options = relationship('QuestionOption', back_populates='question', cascade='all, delete-orphan')
  responses = relationship('QuestionResponse', back_populates='question')

class QuestionOption(db.Model):
  __tablename__ = 'question_options'
  
  id = db.Column(db.Integer, primary_key=True)
  question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
  option_text = db.Column(db.Text, nullable=False)
  is_correct = db.Column(db.Boolean, default=False)
  order = db.Column(db.Integer)
  
  question = relationship('Question', back_populates='options')
  selected_in = relationship('ResponseOption', back_populates='question_option')

class TestSession(db.Model):
  __tablename__ = 'test_sessions'

  id = db.Column(db.Integer, primary_key=True)
  test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  start_time = db.Column(db.DateTime, nullable=False)
  end_time = db.Column(db.DateTime)
  score = db.Column(db.Float)
  status = db.Column(db.String(20), default='in_progress')
  passed = db.Column(db.Boolean)
  time_spent = db.Column(db.Integer)
  remaining_time = db.Column(db.Integer)
  current_question_index = db.Column(db.Integer, default=0)
  test = relationship('Test', back_populates='test_sessions')
  user = relationship('User', back_populates='test_sessions')
  responses = relationship('QuestionResponse', back_populates='test_session', lazy='dynamic')

class QuestionResponse(db.Model):
  __tablename__ = 'question_responses'

  id = db.Column(db.Integer, primary_key=True)
  session_id = db.Column(db.Integer, db.ForeignKey('test_sessions.id'), nullable=False)
  question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
  text_response = db.Column(db.Text)
  is_correct = db.Column(db.Boolean)

  test_session = relationship('TestSession', back_populates='responses')
  question = relationship('Question', back_populates='responses')
  selected_options = relationship('ResponseOption', back_populates='question_response', lazy='dynamic')

class ResponseOption(db.Model):
  __tablename__ = 'response_options'

  id = db.Column(db.Integer, primary_key=True)
  response_id = db.Column(db.Integer, db.ForeignKey('question_responses.id'), nullable=False)
  option_id = db.Column(db.Integer, db.ForeignKey('question_options.id'), nullable=False)

  question_response = relationship('QuestionResponse', back_populates='selected_options')
  question_option = relationship('QuestionOption', back_populates='selected_in')