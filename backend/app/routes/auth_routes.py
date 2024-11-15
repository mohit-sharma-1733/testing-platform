from datetime import datetime
from flask import Blueprint, make_response, request, jsonify
from flask_cors import cross_origin
from flask_jwt_extended import (
  create_access_token,
  create_refresh_token,
  get_jwt_identity,
  jwt_required,
  get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import TokenBlocklist, User
from app import db

auth_routes = Blueprint('auth', __name__)



@auth_routes.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
  user_id = get_jwt_identity()
  user = User.query.get(user_id)
  
  if not user:
      return jsonify({'error': 'User not found'}), 404
  
  return jsonify({
      'id': user.id,
      'email': user.email,
      'name': f"{user.first_name}{' '} {user.last_name}",
      'role': user.role  # Assuming you have a role field
  }), 200

@auth_routes.route('/register', methods=['POST'])
def register():
  data = request.get_json()
  
  if User.query.filter_by(email=data['email']).first():
      return jsonify({'error': 'Email already registered'}), 409
      
  user = User(
      email=data['email'],
      password=generate_password_hash(data['password']),
      first_name=data['first_name'],
      last_name=data['last_name'],
      role=data.get('role', 'user')  # Default to 'user' if not specified
  )
  
  db.session.add(user)
  db.session.commit()
  
  return jsonify({'message': 'User created successfully'}), 201
@auth_routes.route('/login', methods=['POST'])
def login():
  data = request.get_json()
  user = User.query.filter_by(email=data['email']).first()
  
  if not user or not check_password_hash(user.password, data['password']):
      return jsonify({'error': 'Invalid credentials'}), 401
  
  # Add additional claims to the JWT tokens
  additional_claims = {
      'email': user.email,
      'first_name': user.first_name,
      'last_name':user.last_name,
      'role': user.role
  }
  
  access_token = create_access_token(
      identity=user.id,
      additional_claims=additional_claims
  )
  refresh_token = create_refresh_token(
      identity=user.id,
      additional_claims=additional_claims
  )
  
  return jsonify({
      'access_token': access_token,
      'refresh_token': refresh_token,
      'user': {
          'id': user.id,
          'email': user.email,
          'name': f"{user.first_name}{' '}{user.last_name}",
          'role': user.role
      }
  }), 200

@auth_routes.route('/validate', methods=['GET', 'OPTIONS'])
@cross_origin()
@jwt_required()
def validate_token():
  if request.method == "OPTIONS":
      response = make_response()
      response.headers.add("Access-Control-Allow-Origin", "*")
      response.headers.add("Access-Control-Allow-Headers", "*")
      response.headers.add("Access-Control-Allow-Methods", "*")
      return response
      
  user_id = get_jwt_identity()
  user = User.query.get(user_id)
  
  if not user:
      return jsonify({'error': 'User not found'}), 404
  
  return jsonify({
      'id': user.id,
      'email': user.email,
      'name': user.name
  }), 200

@auth_routes.route('/logout', methods=['POST'])
@jwt_required()
def logout():
  try:
      jti = get_jwt()["jti"]  
      now = datetime.utcnow()
      
      # Create token blocklist entry
      token_block = TokenBlocklist(
          jti=jti,
          created_at=now
      )
      db.session.add(token_block)
      db.session.commit()
      
      return jsonify({
          'message': 'Successfully logged out',
          'logout_at': now.isoformat()
      }), 200
  except Exception as e:
      db.session.rollback()
      return jsonify({
          'error': 'Logout failed',
          'message': str(e)
      }), 500