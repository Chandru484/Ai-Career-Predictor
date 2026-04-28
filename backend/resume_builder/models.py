"""
SQLAlchemy models + Pydantic schemas for the Resume Builder module.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


# ---------------------------------------------------------------------------
# SQLAlchemy Model
# ---------------------------------------------------------------------------

class ResumeDocument(Base):
    """A user's saved resume document (built in the Resume Builder)."""
    __tablename__ = "resume_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_clerk_id = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Untitled Resume")

    # Template / appearance
    template_name = Column(String(100), nullable=False, default="universal")
    theme_color = Column(String(20), nullable=False, default="#6366f1")
    font_size = Column(String(20), nullable=False, default="medium")   # small|medium|large
    spacing = Column(String(20), nullable=False, default="normal")     # compact|normal|relaxed
    show_decorations = Column(Integer, nullable=False, default=1)      # 0|1

    # Section order (JSON array of section keys)
    section_order = Column(JSON, nullable=False, default=lambda: [
        "personal", "summary", "experience", "education", "skills", "projects"
    ])

    # Content: one big JSON blob (fast reads, flexible schema)
    content = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""
    photo_url: str = ""


class ExperienceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company: str = ""
    title: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    bullets: List[str] = []


class EducationItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution: str = ""
    degree: str = ""
    field: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""


class ProjectItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    technologies: str = ""
    url: str = ""
    github_url: str = ""
    bullets: List[str] = []


class ResumeContent(BaseModel):
    personal: PersonalInfo = Field(default_factory=PersonalInfo)
    summary: str = ""
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []
    skills: List[str] = []
    skill_categories: Dict[str, List[str]] = {}
    projects: List[ProjectItem] = []


class ResumeDocumentCreate(BaseModel):
    title: str = "Untitled Resume"
    template_name: str = "universal"
    theme_color: str = "#6366f1"
    font_size: str = "medium"
    spacing: str = "normal"
    show_decorations: bool = True
    section_order: List[str] = ["personal", "summary", "experience", "education", "skills", "projects"]
    content: Dict[str, Any] = {}


class ResumeDocumentUpdate(BaseModel):
    title: Optional[str] = None
    template_name: Optional[str] = None
    theme_color: Optional[str] = None
    font_size: Optional[str] = None
    spacing: Optional[str] = None
    show_decorations: Optional[bool] = None
    section_order: Optional[List[str]] = None
    content: Optional[Dict[str, Any]] = None


class ResumeDocumentResponse(BaseModel):
    id: str
    user_clerk_id: str
    title: str
    template_name: str
    theme_color: str
    font_size: str
    spacing: str
    show_decorations: bool
    section_order: List[str]
    content: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, doc: ResumeDocument) -> "ResumeDocumentResponse":
        return cls(
            id=doc.id,
            user_clerk_id=doc.user_clerk_id,
            title=doc.title,
            template_name=doc.template_name,
            theme_color=doc.theme_color,
            font_size=doc.font_size,
            spacing=doc.spacing,
            show_decorations=bool(doc.show_decorations),
            section_order=doc.section_order or [],
            content=doc.content or {},
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )
