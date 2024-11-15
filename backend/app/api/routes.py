from flask_restful import Resource, reqparse

# API Resource Classes
class UserAPI(Resource):
  def get(self):
      return {'message': 'Get user'}
  
  def post(self):
      return {'message': 'Create user'}

class QuestionAPI(Resource):
  def get(self):
      return {'message': 'Get questions'}
  
  def post(self):
      return {'message': 'Create question'}

# Add more API resource classes here