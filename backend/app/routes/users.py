from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.extensions import db
from werkzeug.security import generate_password_hash

users_routes = Blueprint('users_routes', __name__)

@users_routes.route('/list', methods=['GET'])
@jwt_required()
def get_users():
  try:
      page = request.args.get('page', 1, type=int)
      per_page = request.args.get('per_page', 10, type=int)
      search = request.args.get('search', '')

      query = User.query

      if search:
          search_term = f"%{search}%"
          query = query.filter(
              (User.email.ilike(search_term)) |
              (User.first_name.ilike(search_term)) |
              (User.last_name.ilike(search_term))
          )

      # Get total count for pagination
      total_count = query.count()
      
      # Get paginated users
      users = query.order_by(User.created_at.desc()).paginate(
          page=page, per_page=per_page, error_out=False
      )

      return jsonify({
          'users': [{
              'id': user.id,
              'email': user.email,
              'first_name': user.first_name,
              'last_name': user.last_name,
              'role': user.role,
              'is_active': user.is_active,
              'created_at': user.created_at.isoformat() if user.created_at else None
          } for user in users.items],
          'pagination': {
              'page': page,
              'per_page': per_page,
              'total_pages': users.pages,
              'total_users': total_count
          }
      })

  except Exception as e:
      return jsonify({'error': str(e)}), 500

@users_routes.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
  try:
      user = User.query.get_or_404(user_id)
      return jsonify({
          'id': user.id,
          'email': user.email,
          'first_name': user.first_name,
          'last_name': user.last_name,
          'role': user.role,
          'is_active': user.is_active
      })
  except Exception as e:
      return jsonify({'error': str(e)}), 500

@users_routes.route('/', methods=['POST'])
@jwt_required()
def create_user():
  try:
      data = request.get_json()
      
      # Check if email already exists
      if User.query.filter_by(email=data['email']).first():
          return jsonify({'error': 'Email already exists'}), 400

      new_user = User(
          email=data['email'],
          first_name=data['first_name'],
          last_name=data['last_name'],
          password_hash=generate_password_hash(data['password']),
          role=data.get('role', 'user'),
          is_active=data.get('is_active', True)
      )

      db.session.add(new_user)
      db.session.commit()

      return jsonify({
          'message': 'User created successfully',
          'user': {
              'id': new_user.id,
              'email': new_user.email,
              'first_name': new_user.first_name,
              'last_name': new_user.last_name,
              'role': new_user.role,
              'is_active': new_user.is_active
          }
      }), 201

  except Exception as e:
      db.session.rollback()
      return jsonify({'error': str(e)}), 500

@users_routes.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
  try:
      user = User.query.get_or_404(user_id)
      data = request.get_json()

      # Check if email is being changed and if it already exists
      if 'email' in data and data['email'] != user.email:
          if User.query.filter_by(email=data['email']).first():
              return jsonify({'error': 'Email already exists'}), 400
          user.email = data['email']

      if 'first_name' in data:
          user.first_name = data['first_name']
      if 'last_name' in data:
          user.last_name = data['last_name']
      if 'role' in data:
          user.role = data['role']
      if 'is_active' in data:
          user.is_active = data['is_active']
      if 'password' in data:
          user.password_hash = generate_password_hash(data['password'])

      db.session.commit()

      return jsonify({
          'message': 'User updated successfully',
          'user': {
              'id': user.id,
              'email': user.email,
              'first_name': user.first_name,
              'last_name': user.last_name,
              'role': user.role,
              'is_active': user.is_active
          }
      })

  except Exception as e:
      db.session.rollback()
      return jsonify({'error': str(e)}), 500

@users_routes.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
  try:
      user = User.query.get_or_404(user_id)
      db.session.delete(user)
      db.session.commit()
      return jsonify({'message': 'User deleted successfully'})
  except Exception as e:
      db.session.rollback()
      return jsonify({'error': str(e)}), 500