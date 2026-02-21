from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from functools import wraps
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import inspect, text
import json
import os
import io
import sys
from dotenv import load_dotenv, find_dotenv

# Ensure sibling modules (level2_logic, knowledge_base) are importable on Vercel
sys.path.insert(0, os.path.dirname(__file__))

# Try to look up one level (root) for .env if not found in current dir
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()  # fallback to default behavior


from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from pypdf import PdfReader
from flask import send_file
from werkzeug.utils import secure_filename
try:
    # How it runs locally
    from level2_logic import generate_synthetic_data, calculate_level2_score
    from knowledge_base import get_context
except ImportError:
    # How it runs on Vercel (from the root directory)
    from backend.level2_logic import generate_synthetic_data, calculate_level2_score
    from backend.knowledge_base import get_context

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Database configuration with Vercel-safe defaults
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    else:
        # Use /tmp for Vercel (read-only FS except /tmp), local file otherwise
        if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
            db_path = "/tmp/assessments.db"
        else:
            db_path = os.path.join(os.path.dirname(__file__), "assessments.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cogniwise-secret-key")
    app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL", "admin@cogniwise.ai")
    app.config["ADMIN_PASSWORD"] = os.getenv("ADMIN_PASSWORD", "Admin@123")
    app.config["ADMIN_TOKEN_EXPIRES_IN"] = int(os.getenv("ADMIN_TOKEN_EXPIRES_IN", "28800"))  # 8 hours
    
    # Configure Gemini using new google.genai SDK
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        try:
            from google import genai
            print("Gemini API key found. Client will be initialized in routes.")
        except Exception as e:
            print(f"Error importing google.genai: {e}")
    else:
        print("WARNING: GEMINI_API_KEY not found in environment variables. Chat features will fail.")


    # Allow all origins for all routes with support for credentials
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)

    with app.app_context():
        db.create_all()
        ensure_schema()

    serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])
    register_routes(app, serializer)

    @app.get("/health")
    def health_root():
        try:
            # Test DB connection
            db.session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as e:
            return {"status": "error", "database": str(e)}, 500

    # Mirror health under /api for Vercel route matching
    @app.get("/api/health")
    def health_api():
        try:
            db.session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as e:
            return {"status": "error", "database": str(e)}, 500

    return app


class AssessmentResult(db.Model):
    __tablename__ = "assessment_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=True)
    user_name = db.Column(db.String(255), nullable=True)
    user_email = db.Column(db.String(255), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    condition_type = db.Column(db.String(50), nullable=False)
    age_group = db.Column(db.String(50), nullable=True)
    questionnaire_responses = db.Column(db.Text, nullable=False)
    ml_features = db.Column(db.Text, nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(50), nullable=False)
    risk_label = db.Column(db.String(100), nullable=False)
    requires_level2 = db.Column(db.Boolean, nullable=False, default=False)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    assessed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "user_email": self.user_email,
            "age": self.age,
            "gender": self.gender,
            "address": self.address,
            "condition_type": self.condition_type,
            "age_group": self.age_group,
            "questionnaire_responses": json.loads(self.questionnaire_responses),
            "ml_features": json.loads(self.ml_features),
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "risk_label": self.risk_label,
            "requires_level2": self.requires_level2,
            "admin_notes": self.admin_notes,
            "assessed_at": self.assessed_at.isoformat(),
        }


class UserLevelProgress(db.Model):
    __tablename__ = "user_level_progress"

    user_id = db.Column(db.String(255), primary_key=True)
    level1_completed = db.Column(db.Boolean, nullable=False, default=False)
    level2_unlocked = db.Column(db.Boolean, nullable=False, default=False)
    level3_unlocked = db.Column(db.Boolean, nullable=False, default=False)
    level2_completed = db.Column(db.Boolean, nullable=False, default=False)
    level2_conditions = db.Column(db.Text, nullable=False, default="[]")
    level3_conditions = db.Column(db.Text, nullable=False, default="[]")
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "level1_completed": self.level1_completed,
            "level2_unlocked": self.level2_unlocked,
            "level3_unlocked": self.level3_unlocked,
            "level2_completed": self.level2_completed,
            "level2_conditions": json.loads(self.level2_conditions or "[]"),
            "level3_conditions": json.loads(self.level3_conditions or "[]"),
            "updated_at": self.updated_at.isoformat(),
        }

class Level2Result(db.Model):
    __tablename__ = "level2_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False)
    age_group = db.Column(db.String(50), nullable=False)
    raw_metrics = db.Column(db.Text, nullable=False) # JSON
    domain_scores = db.Column(db.Text, nullable=False) # JSON
    final_risk_score = db.Column(db.Float, nullable=False)
    final_risk_percent = db.Column(db.Float, nullable=False)
    assessed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "age_group": self.age_group,
            "raw_metrics": json.loads(self.raw_metrics),
            "domain_scores": json.loads(self.domain_scores),
            "final_risk_score": self.final_risk_score,
            "final_risk_percent": self.final_risk_percent,
            "assessed_at": self.assessed_at.isoformat(),
        }

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }

def ensure_column(table_name: str, column_name: str, column_sql: str):
    inspector = inspect(db.engine)
    existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
    if column_name not in existing_columns:
        with db.engine.connect() as connection:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"))
        db.session.commit()


def ensure_schema():
    ensure_column("assessment_results", "user_name", "TEXT")
    ensure_column("assessment_results", "user_email", "TEXT")
    ensure_column("assessment_results", "age", "INTEGER")
    ensure_column("assessment_results", "admin_notes", "TEXT")
    ensure_column("assessment_results", "gender", "TEXT")
    ensure_column("assessment_results", "address", "TEXT")

    ensure_column("assessment_results", "address", "TEXT")

    # Ensure profiles columns (Critical for frontend consistency)
    try:
        ensure_column("profiles", "gender", "TEXT")
        ensure_column("profiles", "address", "TEXT")
        ensure_column("profiles", "age_group", "TEXT")
    except Exception as e:
        print(f"Warning: Could not update profiles table schema: {e}")

    # Ensure UserLevelProgress columns (for migration support)
    ensure_column("user_level_progress", "level2_completed", "BOOLEAN")
    ensure_column("user_level_progress", "level2_conditions", "TEXT")
    ensure_column("user_level_progress", "level3_unlocked", "BOOLEAN")
    ensure_column("user_level_progress", "level3_conditions", "TEXT")


def age_to_age_group(age):
    """Derive age_group from age (child, teen, adult, elderly). Returns None if age is None."""
    if age is None:
        return None
    try:
        a = int(age)
        if a < 13:
            return "child"
        if a < 18:
            return "teen"
        if a < 65:
            return "adult"
        return "elderly"
    except (TypeError, ValueError):
        return None


def default_progress_dict(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "level1_completed": False,
        "level2_unlocked": False,
        "level3_unlocked": False,
        "level2_conditions": [],
        "level3_conditions": [],
        "updated_at": datetime.utcnow().isoformat(),
    }


def calculate_risk(condition: str, features: dict) -> dict:
    """
    Simple, deterministic risk calculator that mirrors the original
    Supabase Edge Function behaviour but works for any condition.
    """
    numeric_values = [
        float(v)
        for k, v in features.items()
        if k != "age" and (isinstance(v, (int, float)) or (isinstance(v, str) and str(v).replace(".", "", 1).isdigit()))
    ]

    if not numeric_values:
        risk_score = 0.0
    else:
        avg = sum(numeric_values) / len(numeric_values)
        
        if condition in ["adhd", "asd", "dementia"]:
            # For ADHD, ASD, Dementia we ensure that:
            # High Score (5) = High Risk
            # Low Score (1) = Low Risk
            # So we map 1..5 directly to 0..100%
            # Avg 1 -> 20%, Avg 5 -> 100%
            raw_score = (avg / 5.0) * 100.0
            risk_score = min(100.0, max(0.0, raw_score))
        elif max(numeric_values) <= 10:
            # Legacy logic for other conditions (assuming High Score = Good/Low Risk)
            risk_score = max(0.0, min(100.0, 100.0 - avg * 10.0))
        else:
            # For time‑based or mixed scales, normalise roughly into 0‑100
            normalised = min(avg / max(numeric_values), 1.0)
            risk_score = round(normalised * 100.0, 1)

    if risk_score >= 75:
        risk_level = "high"
        risk_label = "High Risk"
    elif risk_score >= 55:
        risk_level = "moderate"
        risk_label = "Moderate Risk"
    elif risk_score >= 35:
        risk_level = "mild"
        risk_label = "Mild Risk"
    else:
        risk_level = "low"
        risk_label = "Low Risk"

    requires_level2 = risk_score >= 55

    return {
        "risk_score": float(risk_score),
        "risk_level": risk_level,
        "risk_label": risk_label,
        "requires_level2": requires_level2,
    }



def generate_pdf_report(data: dict, title: str) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(title, styles['Title']))
    story.append(Spacer(1, 20))

    # General Info Table
    data_list = []
    for key, value in data.items():
        if key in ["raw_metrics", "questionnaire_responses", "ml_features", "domain_scores", "level2_conditions", "level3_conditions"]:
            continue
        if isinstance(value, (dict, list)):
            continue
            
        clean_key = key.replace('_', ' ').title()
        data_list.append([clean_key, str(value)])
    
    if data_list:
        t = Table(data_list, colWidths=[200, 300])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.whitesmoke),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

    # Add domain scores/metrics if available
    if "domain_scores" in data:
        story.append(Paragraph("Detailed Domain Scores", styles['Heading2']))
        story.append(Spacer(1, 10))
        scores = data["domain_scores"]
        score_data = [[k.replace('_', ' ').title(), f"{v*100:.1f}%"] for k, v in scores.items()]
        t2 = Table(score_data, colWidths=[200, 100])
        t2.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ]))
        story.append(t2)

    doc.build(story)
    buffer.seek(0)
    return buffer


def register_routes(app: Flask, serializer: URLSafeTimedSerializer):
    def require_admin_token(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"message": "Missing admin token"}), 401

            token = auth_header.split(" ", 1)[1].strip()
            try:
                payload = serializer.loads(token, max_age=app.config["ADMIN_TOKEN_EXPIRES_IN"])
            except SignatureExpired:
                return jsonify({"message": "Admin session expired"}), 401
            except BadSignature:
                return jsonify({"message": "Invalid admin token"}), 401

            if payload.get("role") != "admin":
                return jsonify({"message": "Unauthorized"}), 403

            return func(*args, **kwargs)

        return wrapper

    def upsert_progress(user_id: str, condition: str, requires_level2: bool):
        if not user_id:
            return
        
        # Ensure we are in app context if needed, though this is called from route handlers
        progress = UserLevelProgress.query.get(user_id)
        if not progress:
            progress = UserLevelProgress(user_id=user_id)

        progress.level1_completed = True

        level2_conditions = json.loads(progress.level2_conditions or "[]")
        if requires_level2 and condition not in level2_conditions:
            level2_conditions.append(condition)

        progress.level2_unlocked = progress.level2_unlocked or requires_level2
        progress.level2_conditions = json.dumps(level2_conditions)
        progress.updated_at = datetime.utcnow()

        db.session.add(progress)

    @app.post("/api/submit-level1")
    def submit_level1():
        try:
            data = request.get_json(force=True, silent=False) or {}
            condition = (data.get("condition") or "").lower()
            if condition not in {"asd", "adhd", "dementia"}:
                return jsonify({"message": "Invalid or missing condition"}), 400

            features = data.get("features") or {}
            questionnaire_responses = data.get("questionnaire_responses") or {}

            prediction = calculate_risk(condition, features)

            age_value = data.get("age")
            try:
                age_value = int(age_value) if age_value is not None else None
            except (TypeError, ValueError):
                age_value = None

            age_group_value = data.get("age_group")
            if not age_group_value and age_value is not None:
                age_group_value = age_to_age_group(age_value)
            result = AssessmentResult(
                user_id=data.get("user_id"),
                user_name=data.get("user_name"),
                user_email=data.get("user_email"),
                age=age_value,
                condition_type=condition,
                age_group=age_group_value,
                questionnaire_responses=json.dumps(questionnaire_responses),
                ml_features=json.dumps(features),
                risk_score=prediction["risk_score"],
                risk_level=prediction["risk_level"],
                risk_label=prediction["risk_label"],
                requires_level2=prediction["requires_level2"],
                gender=data.get("gender"),
                address=data.get("address"),
                assessed_at=datetime.utcnow(),
            )

            db.session.add(result)
            upsert_progress(data.get("user_id"), condition, prediction["requires_level2"])
            db.session.commit()

            return jsonify(prediction), 200
        except Exception as exc:
            db.session.rollback()
            return (
                jsonify({"message": "Failed to submit assessment", "error": str(exc)}),
                500,
            )

    @app.post("/api/level2/submit")
    def submit_level2():
        try:
            data = request.get_json(force=True, silent=False) or {}
            user_id = data.get("user_id")
            age_group = data.get("age_group")

            if not user_id or not age_group:
                return jsonify({"message": "Missing user_id or age_group"}), 400

            metrics = {}
            if "game_scores" in data and data["game_scores"]:
                # Use real game data normalized from frontend
                # We expect game1, game2, game3 (0.0 to 1.0)
                game_scores = data["game_scores"]
                
                # Convert simplified game scores to "metrics" format expected by calculate_level2_score
                # For simplicity, we can just pass the raw scores if we update the calc logic,
                # OR we map them here. Let's map them to a new 'real_data' key and handle in logic.
                metrics = game_scores
                metrics["is_real_data"] = True
            else:
                metrics = generate_synthetic_data(age_group)

            result_data = calculate_level2_score(age_group, metrics)
            
            level2_result = Level2Result(
                user_id=user_id,
                age_group=age_group,
                raw_metrics=json.dumps(metrics),
                domain_scores=json.dumps(result_data["domain_scores"]),
                final_risk_score=result_data["final_risk_score"],
                final_risk_percent=result_data["final_risk_percent"],
                assessed_at=datetime.utcnow()
            )
            
            db.session.add(level2_result)
            
            unlock_level3 = result_data["final_risk_percent"] >= 55.0
            
            progress = UserLevelProgress.query.get(user_id)
            if not progress:
                progress = UserLevelProgress(user_id=user_id)
            
            progress.level2_completed = True # Mark Level 2 as completed
            progress.level3_unlocked = progress.level3_unlocked or unlock_level3
            if unlock_level3:
                l3_conds = json.loads(progress.level3_conditions or "[]")
                if "high_risk_level2" not in l3_conds:
                    l3_conds.append("high_risk_level2")
                progress.level3_conditions = json.dumps(l3_conds)
                
            progress.updated_at = datetime.utcnow()
            db.session.add(progress)
            
            db.session.commit()
            
            return jsonify({
                "results": level2_result.to_dict(),
                "level3_unlocked": unlock_level3
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": "Failed to submit Level-2", "error": str(e)}), 500

    @app.get("/api/level3/summary/<user_id>")
    def get_level3_summary(user_id: str):
        try:
            # Fetch latest Level-2 result for context
            l2_result = Level2Result.query.filter_by(user_id=user_id).order_by(Level2Result.assessed_at.desc()).first()
            if not l2_result:
                return jsonify({"message": "No Level-2 data found"}), 404
                
            risk_score = l2_result.final_risk_percent
            age_group = l2_result.age_group
            
            # Fetch latest Level-1 result to get Admin Notes if any
            l1_result = AssessmentResult.query.filter_by(user_id=user_id).order_by(AssessmentResult.assessed_at.desc()).first()
            admin_notes = l1_result.admin_notes if l1_result else None
            
            # Condition-Specific Advice
            condition_advice = {
                "child": {
                    "alert": "Autism Spectrum Disorder (ASD) Indicators",
                    "msg": "High probability of social communication and restricted repetitive variations."
                },
                "adult": {
                    "alert": "ADHD & Executive Function Indicators",
                    "msg": "Significant variations in attention, focus, and impulse control detected."
                },
                "elderly": {
                    "alert": "Dementia & Cognitive Decline Indicators",
                    "msg": "Detected decline in memory, orientation, or problem-solving capabilities."
                }
            }
            
            # key map: age_group stored in L2 is "child", "adult", "elderly" usually (checked code: yes)
            spec_advice = condition_advice.get(age_group.lower(), {
                "alert": "Cognitive Health Alert", 
                "msg": "Anomalies detected in cognitive assessment."
            })

            # Basic Emergency Logic
            advice = {
                "condition_title": spec_advice["alert"],
                "condition_msg": spec_advice["msg"],
                "immediate_action": "Consult a specialist immediately." if risk_score > 75 else "Schedule a check-up within 7 days.",
                "explanation": f"Your assessment indicates a {risk_score:.1f}% risk level, which is significant.",
                "color_code": "red" if risk_score > 75 else "orange",
                "admin_notes": admin_notes
            }
            
            return jsonify({
                "risk_score": risk_score, 
                "age_group": age_group, 
                "advice": advice,
                "resultId": l2_result.id
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.get("/api/level3/find_doctors")
    def find_doctors():
        # Mock data - in real app, query a DB based on location/specialty
        doctors = [
            {"name": "Dr. Sarah Smith", "specialty": "Neurologist", "contact": "+1-555-0123", "rating": 4.8},
            {"name": "Dr. James Johnson", "specialty": "Psychiatrist (ADHD/ASD)", "contact": "+1-555-0124", "rating": 4.9},
            {"name": "Dr. Emily Chen", "specialty": "Geriatric Specialist", "contact": "+1-555-0125", "rating": 4.7}
        ]
        return jsonify(doctors), 200

    @app.get("/api/level3/find_hospitals")
    def find_hospitals():
        # Mock data representing nearby emergency centers
        hospitals = [
            {"name": "City General Hospital", "distance": "2.5 km", "emergency_contact": "911", "address": "123 Main St"},
            {"name": "Neuro Care Institute", "distance": "5.0 km", "emergency_contact": "+1-800-NEURO", "address": "456 Medical Dr"}
        ]
        return jsonify(hospitals), 200

    @app.get("/api/level2/results/<user_id>")
    def get_level2_results(user_id: str):
        try:
            results = (
                Level2Result.query.filter_by(user_id=user_id)
                .order_by(Level2Result.assessed_at.desc())
                .all()
            )
            return jsonify([r.to_dict() for r in results]), 200
        except Exception as e:
            return jsonify({"message": "Failed to load results", "error": str(e)}), 500

    @app.get("/api/results/<user_id>")
    def get_results(user_id: str):
        try:
            results = (
                AssessmentResult.query.filter_by(user_id=user_id)
                .order_by(AssessmentResult.assessed_at.desc())
                .all()
            )
            return jsonify([r.to_dict() for r in results]), 200
        except Exception as exc:
            return (
                jsonify({"message": "Failed to load results", "error": str(exc)}),
                500,
            )

    @app.get("/api/progress/<user_id>")
    def get_progress(user_id: str):
        try:
            progress = UserLevelProgress.query.get(user_id)
            if not progress:
                return jsonify(default_progress_dict(user_id)), 200
            return jsonify(progress.to_dict()), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"message": "Failed to get progress", "error": str(e), "trace": traceback.format_exc()}), 500

    @app.post("/api/admin/login")
    def admin_login():
        credentials = request.get_json(force=True, silent=False) or {}
        email = (credentials.get("email") or "").strip().lower()
        password = credentials.get("password") or ""

        if email != app.config["ADMIN_EMAIL"].lower() or password != app.config["ADMIN_PASSWORD"]:
            return jsonify({"message": "Invalid credentials"}), 401

        token = serializer.dumps({"role": "admin", "issued_at": datetime.utcnow().isoformat()})
        return jsonify({"token": token, "role": "admin"}), 200

    @app.get("/api/admin/users")
    @require_admin_token
    def admin_users():
        subquery = (
            db.session.query(
                AssessmentResult.user_id,
                db.func.max(AssessmentResult.assessed_at).label("latest_assessment"),
            )
            .group_by(AssessmentResult.user_id)
            .subquery()
        )

        latest_records = (
            db.session.query(AssessmentResult)
            .join(
                subquery,
                (AssessmentResult.user_id == subquery.c.user_id)
                & (AssessmentResult.assessed_at == subquery.c.latest_assessment),
            )
            .order_by(AssessmentResult.assessed_at.desc())
            .all()
        )

        payload = []
        for record in latest_records:
            progress = UserLevelProgress.query.get(record.user_id)
            age_group_display = record.age_group or age_to_age_group(record.age)
            payload.append(
                {
                    "user_id": record.user_id,
                    "name": record.user_name,
                    "email": record.user_email,
                    "age": record.age,
                    "gender": record.gender,
                    "address": record.address,
                    "age_group": age_group_display,
                    "last_assessed": record.assessed_at.isoformat(),
                    "level_progress": progress.to_dict() if progress else default_progress_dict(record.user_id),
                }
            )

        return jsonify(payload), 200

    @app.get("/api/admin/users/<user_id>/assessments")
    @require_admin_token
    def admin_user_assessments(user_id: str):
        results = (
            AssessmentResult.query.filter_by(user_id=user_id)
            .order_by(AssessmentResult.assessed_at.desc())
            .all()
        )
        return jsonify([r.to_dict() for r in results]), 200

    @app.post("/api/admin/assessments/<int:assessment_id>/suggestion")
    @require_admin_token
    def admin_save_suggestion(assessment_id: int):
        payload = request.get_json(force=True, silent=False) or {}
        notes = payload.get("notes", "").strip()

        result = AssessmentResult.query.get_or_404(assessment_id)
        result.admin_notes = notes or None
        db.session.commit()

        return jsonify({"message": "Suggestion saved", "assessment": result.to_dict()}), 200

    @app.get("/api/reports/<result_type>/<id>/pdf")
    def download_report_pdf(result_type, id):
        try:
            if result_type == "level1":
                record = AssessmentResult.query.get_or_404(id)
                data = record.to_dict()
                title = f"Assessment Report - {data.get('condition_type', '').upper()}"
            elif result_type == "level2":
                record = Level2Result.query.get_or_404(id)
                data = record.to_dict()
                title = f"Level 2 Assessment Report - {data.get('age_group', '').title()}"
            elif result_type == "level3":
                # Level 3 uses Level 2 data but formats it as Emergency Report
                record = Level2Result.query.get_or_404(id)
                data = record.to_dict()
                data['EMERGENCY_NOTICE'] = "High Risk Detected - Immediate Intervention Advised"
                title = "EMERGENCY INTERVENTION REPORT - IMMEDIATE ACTION REQUIRED"
            else:
                return jsonify({"message": "Invalid report type"}), 400

            pdf_buffer = generate_pdf_report(data, title)
            
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name=f"report_{result_type}_{id}.pdf",
                mimetype='application/pdf'
            )
        except Exception as e:
            return jsonify({"message": "Failed to generate PDF", "error": str(e)}), 500

    @app.get("/api/chat/history")
    def get_chat_history():
        user_id = request.args.get("user_id") # specific user or from session if we implemented auth middleware here
        # For simplicity, assuming user_id checks passed or we trust the query param for now (in prod, use token)
        # But wait, other routes don't verify token except admin. 
        # The frontend calls supabase auth, but backend routes here (submit-level1) just take user_id. 
        # We will follow that pattern for now, but ideally we should verify.
        
        if not user_id:
             return jsonify([]), 200

        messages = ChatMessage.query.filter_by(user_id=user_id).order_by(ChatMessage.created_at.asc()).limit(50).all()
        return jsonify([m.to_dict() for m in messages]), 200

    @app.post("/api/chat/send")
    def chat_send():
        try:
            data = request.get_json(force=True)
            user_id = data.get("user_id")
            message = data.get("message")
            history = data.get("history", []) # list of {role, content}

            if not user_id or not message:
                return jsonify({"message": "Missing required fields"}), 400

            # 1. Save User Message
            user_msg = ChatMessage(user_id=user_id, role="user", content=message)
            db.session.add(user_msg)
            db.session.commit()

            # 2. Build Context
            # Provide general knowledge base context
            kb_context = get_context() 
            
            # Construct Prompt
            system_instruction = f"""You are CogniWise AI, a helpful medical assistant for cognitive assessments.
            Use the following knowledge base context to answer the user's questions.
            
            KNOWLEDGE BASE CONTEXT:
            {kb_context}
            
            IMPORTANT INSTRUCTIONS:
            1. **STRICT DOMAIN RESTRICTION**: You are a specialized medical assistant. You MUST NOT answer questions about general knowledge, politics, sports, movies, or current events (e.g., "Who is the PM?", "What is the capital of France?").
            2. If a user asks a non-medical question, politely refuse and state: "I am CogniWise AI, specialized in cognitive health. I cannot answer general knowledge or political questions. Please ask me about brain health, ADHD, dementia, or cognitive assessments."
            3. If the user asks in Kannada (or any other language), you MUST reply in that same language.
            4. If the user asks to translate or explain an uploaded medical document, do so accurately in the requested language.
            5. Keep responses concise, empathetic, and professional.
            """
            
            # If user uploaded a PDF recently, we might want to include it. 
            # For this simple implementation, we assume the PDF content was sent in the message or we rely on history if we had a vector db.
            # But the requirement says "give option to upload the pdf". 
            # We will handle PDF upload in /upload endpoint and append its content to the conversation history or context?
            # A simple way: The /upload endpoint extracts text and saves it as a system message or hidden user message.
            
            if not os.getenv("GEMINI_API_KEY"):
                return jsonify({"message": "Server configuration error: Gemini API Key missing"}), 500

            # Use new google.genai SDK
            from google import genai
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            
            # Prepare chat history for the new SDK
            # Format: contents=[Content(role='user', parts=[...]), ...]
            # The SDK handles this slightly differently, but the simplest way is to just 
            # concat history or use the chat interface if available. 
            # For simplicity in this specialized context, let's construct the prompt with history manually 
            # or use the simple generate_content with system instruction if supported by the model version.
            
            # Construct a full conversation prompt
            full_prompt = system_instruction + "\n\n"
            for h in history:
                role_label = "User" if h["role"] == "user" else "Model"
                full_prompt += f"{role_label}: {h['content']}\n"
            
            full_prompt += f"User: {message}\nModel:"

            # List of models to try in order of preference
            models_to_try = ['gemini-2.0-flash', 'gemini-flash-latest']
            response_text = None
            last_error = None

            for model_name in models_to_try:
                try:
                    print(f"Attempting chat with model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name, 
                        contents=[full_prompt]
                    )
                    if hasattr(response, 'text') and response.text:
                        response_text = response.text
                        break # Success!
                    else:
                        print(f"Model {model_name} returned empty text.")
                except Exception as e:
                    print(f"Model {model_name} failed: {e}")
                    last_error = e
                    # If it's a quota error (429), we might want to fail fast or continue.
                    # Usually 429 applies to the project, so switching models might not help if they share quota.
                    # But if one is free tier and other is paid (unlikely here), or different buckets.
                    # We continue to try the next model just in case.
            
            if not response_text:
                error_msg = str(last_error) if last_error else "Unknown error"
                if "429" in error_msg:
                    return jsonify({"message": "AI Usage Limit Exceeded. Please wait a minute and try again."}), 429
                return jsonify({"message": f"AI Service Unavailable: {error_msg}"}), 500

            # 3. Save Assistant Message
            ai_msg = ChatMessage(user_id=user_id, role="assistant", content=response_text)
            db.session.add(ai_msg)
            db.session.commit()

            return jsonify({"response": response_text}), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"message": "Chat error", "error": str(e), "trace": traceback.format_exc()}), 500

    @app.post("/api/chat/upload")
    def chat_upload():
        try:
            if 'file' not in request.files:
                return jsonify({"message": "No file part"}), 400
            file = request.files['file']
            user_id = request.form.get("user_id")
            
            if file.filename == '':
                return jsonify({"message": "No selected file"}), 400
                
            if file and user_id:
                # Parse PDF
                pdf_reader = PdfReader(file)
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
                
                # Truncate if too long (simple protection)
                text_content = text_content[:10000] 
                
                summary = f"[User uploaded PDF content]:\n{text_content}\n[End of PDF]"
                
                # Save as a user message but with clear indication it is document context
                # We save a larger portion of context for the AI to 'remember' it in chat history
                msg = ChatMessage(user_id=user_id, role="user", content=f"I am uploading a document for analysis: {file.filename}.\n\nDocument Content:\n{text_content}\n\n[End of Document]\nPlease analyze this document and answer my questions about it.")
                db.session.add(msg)
                db.session.commit()
                
                # We return the extracted text so frontend can optionally display or just acknowledge
                return jsonify({"message": "File processed successfully", "extracted_text": summary}), 200
                
        except Exception as e:
            return jsonify({"message": "Upload failed", "error": str(e)}), 500


# Export app for Vercel Python runtime
app = create_app()

if __name__ == "__main__":
    # Only for local development
    app.run(host="0.0.0.0", port=5000, debug=True)
