from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import verify_token
from backend.database import get_db
from backend.models import Prediction, User
from backend.schemas import MockInterviewResponse
from backend.services.gemini_service import generate_structured_json
from backend.services.prompt_builder import build_mock_interview_prompt

router = APIRouter()
LIST_FIELDS = (
    "warmup_questions",
    "technical_questions",
    "behavioral_questions",
    "interviewer_focus",
    "answer_tips",
)


async def get_current_user(request: Request, db: AsyncSession) -> User:
    clerk_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user


@router.get("/{prediction_id}", response_model=MockInterviewResponse)
async def generate_mock_interview(
    prediction_id: int,
    request: Request,
    target_role: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    result = await db.execute(
        select(Prediction).filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
    )
    prediction = result.scalars().first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")

    prompt = build_mock_interview_prompt(
        prediction.resume_text or "",
        prediction.prediction_result or {},
        prediction.personality_data or {},
        target_role=target_role,
    )

    try:
        interview_data = await generate_structured_json(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to generate mock interview: {exc}")

    normalized_data = {
        "target_role": interview_data.get("target_role") or target_role or "",
    }

    for field_name in LIST_FIELDS:
        value = interview_data.get(field_name)
        if isinstance(value, list):
            normalized_data[field_name] = [str(item).strip() for item in value if str(item).strip()]
        elif isinstance(value, str) and value.strip():
            normalized_data[field_name] = [value.strip()]
        else:
            normalized_data[field_name] = []

    return MockInterviewResponse(**normalized_data)
