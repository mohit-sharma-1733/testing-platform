from flask import Flask
from flask_cors import CORS
from app.config.config import Config
from app.extensions import db, jwt
from app.models.user import TokenBlocklist

def create_app(config=Config):
  app = Flask(__name__)
  app.config.from_object(config)
  
  # Initialize extensions
  db.init_app(app)
  jwt.init_app(app)
  CORS(app, resources={
      r"/api/*": {
          "origins": ["http://localhost:3000"],
          "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          "allow_headers": ["Content-Type", "Authorization"],
          "expose_headers": ["Content-Range", "X-Content-Range"],
          "supports_credentials": True
      }
  })
  # Register blueprints
  from app.routes.auth_routes import auth_routes
  from app.routes.test_routes import test_routes
  from app.routes.leaderboard import leaderboard_routes
  from app.routes.users import users_routes
  from app.routes.dashboard_routes import dashboard_routes
  app.register_blueprint(auth_routes, url_prefix='/api/auth')
  app.register_blueprint(test_routes, url_prefix='/api/tests')
  app.register_blueprint(leaderboard_routes, url_prefix='/api/leaderboard')
  app.register_blueprint(users_routes,url_prefix='/api/users')
  app.register_blueprint(dashboard_routes,url_prefix='/api/dashboard')
  # JWT configuration
  @jwt.token_in_blocklist_loader
  def check_if_token_revoked(jwt_header, jwt_payload):
      jti = jwt_payload['jti']
      token = TokenBlocklist.query.filter_by(jti=jti).first()
      return token is not None
  
  return app