from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import verify_token
from backend.database import get_db
from backend.models import Prediction, User
from backend.schemas import ResumeOptimizationResponse
from backend.services.gemini_service import generate_structured_json
from backend.services.prompt_builder import build_resume_optimizer_prompt

router = APIRouter()


async def get_current_user(request: Request, db: AsyncSession) -> User:
    clerk_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user


@router.get("/{prediction_id}", response_model=ResumeOptimizationResponse)
async def optimize_resume(
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

    if not (prediction.resume_text or "").strip():
        raise HTTPException(status_code=400, detail="Resume optimizer requires parsed resume text.")

    prompt = build_resume_optimizer_prompt(
        prediction.resume_text or "",
        prediction.prediction_result or {},
        prediction.personality_data or {},
        target_role=target_role,
    )

    try:
        optimized = await generate_structured_json(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to optimize resume: {exc}")

    return ResumeOptimizationResponse(**optimized)
