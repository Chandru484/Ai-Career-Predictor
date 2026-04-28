from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

# Import resume_builder model so its table is registered with Base.metadata
# (must happen before create_all is called in main.py lifespan)
from backend.resume_builder.models import ResumeDocument  # noqa: F401


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Agent Preferences
    auto_apply = Column(Integer, default=0) # boolean via integer (0/1) or boolean depending on db
    daily_limit = Column(Integer, default=10)
    min_score = Column(Integer, default=75)
    phone = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    """Tracks every PDF resume a user uploads."""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=True)   # Supabase Storage path
    resume_text = Column(Text, nullable=True)            # Parsed plaintext content
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    personality_data = Column(JSON)
    resume_text = Column(Text)
    prediction_result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
    chat_messages = relationship("ChatMessage", back_populates="prediction", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
    prediction = relationship("Prediction", back_populates="chat_messages")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    target_roles = Column(Text, nullable=True) # JSON array string
    locations = Column(Text, nullable=True) # JSON array string
    
    # Session Cookies for auto-apply bypassing CAPTCHA
    linkedin_cookie = Column(Text, nullable=True)
    indeed_cookie = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="preferences")


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    url_hash = Column(String(255), unique=True, index=True, nullable=False)
    url = Column(Text, nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    platform = Column(String(50), nullable=True)
    easy_apply = Column(String(10), default="False") 
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @staticmethod
    def make_hash(url: str):
        import hashlib
        return hashlib.md5(url.encode()).hexdigest()


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("job_listings.id"), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False) 
    match_score = Column(Integer, nullable=True)
    match_reason = Column(Text, nullable=True)
    skip_reason = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("JobListing")
    user = relationship("User", back_populates="applications")
