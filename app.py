import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__, static_folder='frontend/public')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'prototype_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    dob = db.Column(db.String(20), nullable=False)
    age = db.Column(db.Integer)
    policy_number = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    blood_group = db.Column(db.String(10))
    
    # Emergency Contact
    emergency_name = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(20))
    emergency_pin = db.Column(db.String(10))
    
    # Complex fields stored as JSON strings
    conditions_json = db.Column(db.Text, default='{}')
    allergies_json = db.Column(db.Text, default='{}')
    medications_json = db.Column(db.Text, default='[]')
    history_json = db.Column(db.Text, default='{}')
    special_json = db.Column(db.Text, default='{}')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def calculate_age(self):
        try:
            birth_date = datetime.strptime(self.dob, '%Y-%m-%d')
            today = datetime.today()
            return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except:
            return 0

    def to_dict(self):
        return {
            '_id': str(self.id), # Keeping '_id' so frontend doesn't break
            'fullName': self.full_name,
            'phone': self.phone,
            'dob': self.dob,
            'age': self.age,
            'policyNumber': self.policy_number,
            'bloodGroup': self.blood_group,
            'emergencyName': self.emergency_name,
            'emergencyPhone': self.emergency_phone,
            'emergencyPin': self.emergency_pin,
            'conditions': json.loads(self.conditions_json) if self.conditions_json else {},
            'allergies': json.loads(self.allergies_json) if self.allergies_json else {},
            'medications': json.loads(self.medications_json) if self.medications_json else [],
            'history': json.loads(self.history_json) if self.history_json else {},
            'special': json.loads(self.special_json) if self.special_json else {},
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

# --- Database Initialization ---
with app.app_context():
    db.create_all()

# --- Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'No token, authorization denied'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({'success': False, 'message': 'Token is not valid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# --- Routes ---

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Try to send from frontend/public. If file doesn't exist, maybe it's at root (like logo1.png)
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    elif os.path.exists(path):
        return send_from_directory(os.getcwd(), path)
    return "Not Found", 404

@app.route('/api/auth/verify-policy', methods=['POST'])
def verify_policy():
    data = request.json
    policy = data.get('policyNumber', '')
    if policy.startswith('ZK'):
        return jsonify({'success': True, 'message': 'Policy verified successfully.'})
    return jsonify({'success': False, 'message': 'Invalid policy number. Use a policy starting with ZK.'}), 400

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    phone = data.get('phone')
    if User.query.filter_by(phone=phone).first():
        return jsonify({'success': False, 'message': 'User already exists with this phone number.'}), 400
    
    new_user = User(
        full_name=data.get('fullName'),
        phone=phone,
        dob=data.get('dob'),
        policy_number=data.get('policyNumber'),
        password_hash=generate_password_hash(data.get('password'))
    )
    new_user.age = new_user.calculate_age()
    
    db.session.add(new_user)
    db.session.commit()
    
    token = jwt.encode({
        'user_id': new_user.id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'success': True, 'token': token, 'userId': str(new_user.id)})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    user = User.query.filter_by(phone=phone).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 400
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'success': True, 'token': token, 'userId': str(user.id)})

@app.route('/api/user/<user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    if str(current_user.id) != str(user_id):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    return jsonify({'success': True, 'user': current_user.to_dict()})

@app.route('/api/user/update', methods=['POST'])
@token_required
def update_user(current_user):
    data = request.json
    user_id = data.get('userId')
    
    if str(current_user.id) != str(user_id):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    # Update simple fields
    if 'bloodGroup' in data: current_user.blood_group = data['bloodGroup']
    if 'emergencyName' in data: current_user.emergency_name = data['emergencyName']
    if 'emergencyPhone' in data: current_user.emergency_phone = data['emergencyPhone']
    if 'emergencyPin' in data: current_user.emergency_pin = data['emergencyPin']
    
    # Update JSON fields
    if 'conditions' in data: current_user.conditions_json = json.dumps(data['conditions'])
    if 'allergies' in data: current_user.allergies_json = json.dumps(data['allergies'])
    if 'medications' in data: current_user.medications_json = json.dumps(data['medications'])
    if 'history' in data: current_user.history_json = json.dumps(data['history'])
    if 'special' in data: current_user.special_json = json.dumps(data['special'])
    
    db.session.commit()
    return jsonify({'success': True, 'user': current_user.to_dict()})

@app.route('/api/user/emergency/<user_id>', methods=['GET'])
def get_emergency(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({'success': True, 'user': user.to_dict()})

if __name__ == '__main__':
    app.run(debug=True, port=3000)
