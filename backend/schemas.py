from pydantic import BaseModel, ConfigDict, Field
from typing import Dict, List, Optional
from datetime import datetime

# ── Request Models ──────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    personality_answers: Dict[str, str]
    resume_text: str


# ── Response Models ──────────────────────────────────────────────────────────

class CareerPrediction(BaseModel):
    title: str
    match_percentage: float
    reasons: List[str]
    skills_to_develop: List[str]


class PredictionResponse(BaseModel):
    prediction_id: Optional[int] = None
    careers: List[CareerPrediction]
    summary: str


# ── Resume Upload ────────────────────────────────────────────────────────────

class ResumeUploadResponse(BaseModel):
    resume_id: int
    file_name: str
    resume_text: str
    storage_path: Optional[str] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeDetailResponse(BaseModel):
    resume_id: int
    file_name: str
    resume_text: str
    storage_path: Optional[str] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── DB Response Models ───────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    top_career: str
    summary: str


class PredictionDetail(BaseModel):
    id: int
    created_at: datetime
    personality_data: Dict[str, str]
    resume_text: str
    prediction_result: PredictionResponse

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    prediction_id: int
    message: str


class ChatMessageItem(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatReplyResponse(BaseModel):
    reply: str
    messages: List[ChatMessageItem]


class ResumeOptimizationResponse(BaseModel):
    target_role: str
    professional_summary: str
    missing_keywords: List[str]
    bullet_improvements: List[str]
    recruiter_tips: List[str]


class MockInterviewResponse(BaseModel):
    target_role: str = ""
    warmup_questions: List[str] = Field(default_factory=list)
    technical_questions: List[str] = Field(default_factory=list)
    behavioral_questions: List[str] = Field(default_factory=list)
    interviewer_focus: List[str] = Field(default_factory=list)
    answer_tips: List[str] = Field(default_factory=list)
