from datetime import datetime
from app.extensions import db
from sqlalchemy.orm import relationship
from enum import Enum

class User(db.Model):
  __tablename__ = 'users'
  
  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(120), unique=True, nullable=False)
  password = db.Column(db.String(255), nullable=False)
  first_name = db.Column(db.String(50))
  last_name = db.Column(db.String(50))
  role = db.Column(db.String(20), default='user')
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  is_active = db.Column(db.Boolean, default=True)
  
  created_tests = relationship('Test', back_populates='creator')
  test_sessions = relationship('TestSession', back_populates='user', lazy='dynamic')

class TokenBlocklist(db.Model):
  __tablename__ = 'token_blocklist'
  
  id = db.Column(db.Integer, primary_key=True)
  jti = db.Column(db.String(36), nullable=False, unique=True)
  created_at = db.Column(db.DateTime, nullable=False)

