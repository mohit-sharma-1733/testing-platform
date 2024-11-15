import os
from datetime import timedelta

class Config:
  # Database
  SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/testing_platform')
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  
  # JWT Configuration
  JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
  JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
  JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
  
  # Application Configuration
  SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
  DEBUG = True
  GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')