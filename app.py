import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from textblob import TextBlob

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-keep-it-secret'
# Enable SQLite database, storing it locally in the project folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hiring.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# --- DATABASE MODELS ---

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    interviews = db.relationship('Interview', backref='candidate', lazy=True)

class Interview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    total_score = db.Column(db.Float, default=0.0)
    overall_sentiment = db.Column(db.String(50), default='Neutral')
    answers = db.relationship('Answer', backref='interview', lazy=True)

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interview.id'), nullable=False)
    question_text = db.Column(db.String(500), nullable=False)
    user_answer = db.Column(db.Text, nullable=False)
    sentiment_label = db.Column(db.String(50), nullable=False)
    confidence_score = db.Column(db.Integer, default=0)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROUTES ---

@app.route('/')
def index():
    if current_user.is_authenticated:
         return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user_exists = User.query.filter_by(username=username).first()
        if user_exists:
            flash('Username already exists. Please choose another.', 'danger')
            return redirect(url_for('signup'))
        
        new_user = User(
            username=username, 
            password_hash=generate_password_hash(password, method='scrypt')
        )
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            flash('Logged in successfully.', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

QUESTIONS = [
    "Tell me about a time you faced a difficult challenge at work.",
    "How do you handle working under tight deadlines?",
    "Describe a situation where you had to learn a new technology quickly."
]

@app.route('/interview', methods=['GET', 'POST'])
@login_required
def interview():
    if request.method == 'POST':
        # Create a new interview entry
        new_interview = Interview(user_id=current_user.id)
        db.session.add(new_interview)
        db.session.commit()
        return redirect(url_for('interview_question', interview_id=new_interview.id, q_index=0))
    
    return render_template('interview_start.html')

@app.route('/interview/<int:interview_id>/<int:q_index>', methods=['GET', 'POST'])
@login_required
def interview_question(interview_id, q_index):
    # Security check
    interview_obj = Interview.query.get_or_404(interview_id)
    if interview_obj.user_id != current_user.id:
        return redirect(url_for('dashboard'))
        
    if q_index >= len(QUESTIONS):
        # Interview finished, calculate overall score
        answers = Answer.query.filter_by(interview_id=interview_id).all()
        total_score = 0
        sentiment_scores = []
        for ans in answers:
            total_score += ans.confidence_score
            sentiment_scores.append(ans.sentiment_label)
        
        # average sentiment
        if sentiment_scores:
            pos_m = sentiment_scores.count('Positive')
            neg_m = sentiment_scores.count('Negative')
            if pos_m > neg_m:
                overall_sent = 'Positive'
            elif neg_m > pos_m:
                overall_sent = 'Negative'
            else:
                overall_sent = 'Neutral'
        else:
            overall_sent = 'Neutral'
            
        interview_obj.total_score = total_score / (len(QUESTIONS) or 1)
        interview_obj.overall_sentiment = overall_sent
        db.session.commit()
        
        return redirect(url_for('result', interview_id=interview_id))
        
    current_q = QUESTIONS[q_index]
    
    if request.method == 'POST':
        user_answer = request.form.get('answer')
        
        # NLP Analysis
        blob = TextBlob(user_answer)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            sentiment_label = 'Positive'
        elif polarity < -0.1:
            sentiment_label = 'Negative'
        else:
            sentiment_label = 'Neutral'
            
        # simple keyword-based confidence evaluation
        confidence_words = ['definitely', 'absolutely', 'confident', 'sure', 'successfully', 'achieved', 'lead', 'managed', 'resolved']
        words = user_answer.lower().split()
        confidence_score = 50 # base score
        for w in confidence_words:
            if w in words:
                confidence_score += 10
                
        # cap at 100
        confidence_score = min(confidence_score + int(polarity * 20), 100)
        confidence_score = max(confidence_score, 0) # don't go below 0
        
        # Save Answer
        new_answer = Answer(
            interview_id=interview_id,
            question_text=current_q,
            user_answer=user_answer,
            sentiment_label=sentiment_label,
            confidence_score=confidence_score
        )
        db.session.add(new_answer)
        db.session.commit()
        
        # go to next question
        return redirect(url_for('interview_question', interview_id=interview_id, q_index=q_index+1))
        
    return render_template('interview_question.html', question=current_q, q_index=q_index, total=len(QUESTIONS))

@app.route('/result/<int:interview_id>')
@login_required
def result(interview_id):
    interview_obj = Interview.query.get_or_404(interview_id)
    if interview_obj.user_id != current_user.id:
        return redirect(url_for('dashboard'))
        
    answers = Answer.query.filter_by(interview_id=interview_id).all()
    
    # Generate simple feedback based on score
    if interview_obj.total_score >= 80:
        feedback = "Excellent performance! Your answers showed high confidence and positive sentiment."
    elif interview_obj.total_score >= 50:
        feedback = "Good job. Try to use more positive and decisive language to project higher confidence."
    else:
        feedback = "There is room for improvement. Focus on highlighting your successes positively."
        
    return render_template('result.html', interview=interview_obj, answers=answers, feedback=feedback)

@app.route('/history')
@login_required
def history():
    interviews = Interview.query.filter_by(user_id=current_user.id).order_by(Interview.date.desc()).all()
    return render_template('history.html', interviews=interviews)

# --- APP EXECUTION ---
if __name__ == '__main__':
    with app.app_context():
        # Create all database tables if they don't exist
        db.create_all()
    app.run(debug=True)
