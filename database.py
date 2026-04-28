from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean,
    DateTime, ForeignKey, create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
import hashlib

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True)
    name            = Column(String, nullable=False)
    email           = Column(String, unique=True, nullable=False)
    phone           = Column(String)                    # for WhatsApp notifications
    auto_apply      = Column(Boolean, default=False)    # master toggle
    daily_limit     = Column(Integer, default=10)       # max applies per day
    min_score       = Column(Integer, default=70)       # match score threshold
    created_at      = Column(DateTime, default=datetime.utcnow)

    applications    = relationship("Application", back_populates="user")
    preferences     = relationship("UserPreference", back_populates="user", uselist=False)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    target_roles    = Column(Text)      # JSON list of role strings
    locations       = Column(Text)      # JSON list of city strings
    experience_yrs  = Column(Integer)
    salary_min      = Column(Integer)
    work_type       = Column(String)    # remote / hybrid / onsite

    user            = relationship("User", back_populates="preferences")


class JobListing(Base):
    __tablename__ = "job_listings"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    url_hash        = Column(String, unique=True, nullable=False, index=True)
    url             = Column(String, nullable=False)
    title           = Column(String, nullable=False)
    company         = Column(String, nullable=False)
    location        = Column(String)
    description     = Column(Text)
    platform        = Column(String)    # naukri / linkedin / indeed
    easy_apply      = Column(Boolean, default=False)
    scraped_at      = Column(DateTime, default=datetime.utcnow)

    applications    = relationship("Application", back_populates="job")

    @staticmethod
    def make_hash(url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()


class Application(Base):
    __tablename__ = "applications"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    job_id          = Column(Integer, ForeignKey("job_listings.id"), nullable=False)
    status          = Column(String, default="pending")  # applied / skipped / failed / pending
    match_score     = Column(Float)
    match_reason    = Column(Text)
    cover_letter    = Column(Text)
    skip_reason     = Column(Text)
    error_message   = Column(Text)
    retry_count     = Column(Integer, default=0)
    applied_at      = Column(DateTime)
    created_at      = Column(DateTime, default=datetime.utcnow)

    user            = relationship("User", back_populates="applications")
    job             = relationship("JobListing", back_populates="applications")


# ── DB setup ──────────────────────────────────────────────────────────────────

DATABASE_URL = "sqlite:///./career_ai.db"   # swap for postgres in prod

engine       = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
