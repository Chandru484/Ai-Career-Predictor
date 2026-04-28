from fastapi import APIRouter, Depends, Request, HTTPException
import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.schemas import PredictionRequest, PredictionResponse
from backend.services.prompt_builder import build_prediction_prompt
from backend.services.gemini_service import predict_careers
from backend.database import get_db
from backend.models import User, Prediction
from backend.auth import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)


def _friendly_prediction_error(exc: Exception) -> tuple[int, str]:
    message = str(exc)
    lowered = message.lower()

    if "429" in lowered or "too many requests" in lowered or "quota" in lowered:
        return 503, "The AI service is temporarily busy right now. Please wait a moment and try again."

    if "timeout" in lowered or "timed out" in lowered:
        return 504, "The AI service took too long to respond. Please try again in a moment."

    if "api_key" in lowered or "api key" in lowered:
        return 503, "The AI service is not configured correctly right now. Please try again later."

    return 502, "We couldn't generate your career prediction right now. Please try again."

@router.post("", response_model=PredictionResponse)
async def generate_prediction(
    request: Request,
    payload: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_token)
):
    clerk_id = request.state.user_id
    email = getattr(request.state, "email", f"{clerk_id}@placeholder.com")

    # Ensure user exists in our DB
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()

    if not user:
        user = User(clerk_user_id=clerk_id, email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 1. Build prompt
    prompt = build_prediction_prompt(payload.personality_answers, payload.resume_text)
    
    # 2. Call Gemini
    try:
        prediction_result = await asyncio.wait_for(predict_careers(prompt), timeout=45)
        if not prediction_result.get("careers"):
            raise Exception("Prediction response did not include any career matches.")
    except Exception as e:
        logger.warning("Prediction generation failed: %s", e)
        status_code, detail = _friendly_prediction_error(e)
        raise HTTPException(status_code=status_code, detail=detail)

    # 3. Save to DB
    new_prediction = Prediction(
        user_id=user.id,
        personality_data=payload.personality_answers,
        resume_text=payload.resume_text,
        prediction_result=prediction_result
    )
    db.add(new_prediction)
    await db.commit()
    await db.refresh(new_prediction)
    
    # Validates and outputs prediction directly from the generated dict
    return PredictionResponse(prediction_id=new_prediction.id, **prediction_result)
