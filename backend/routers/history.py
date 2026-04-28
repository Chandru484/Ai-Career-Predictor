from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List

from backend.database import get_db
from backend.models import User, Prediction
from backend.auth import verify_token
from backend.schemas import HistoryItem, PredictionDetail

router = APIRouter()

async def get_current_user_db(request: Request, db: AsyncSession) -> User:
    clerk_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user

@router.get("", response_model=List[HistoryItem])
async def get_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_token)
):
    try:
        user = await get_current_user_db(request, db)
    except HTTPException:
        return [] # new user with no predictions yet

    result = await db.execute(
        select(Prediction).filter(Prediction.user_id == user.id).order_by(desc(Prediction.created_at))
    )
    predictions = result.scalars().all()
    
    history_list = []
    for p in predictions:
        # Extract the highest matched title
        res_json = p.prediction_result or {}
        careers = res_json.get("careers", [])
        top_career = careers[0]["title"] if careers else "Unknown Career"
        summary = res_json.get("summary", "No summary available")
        
        history_list.append(
            HistoryItem(
                id=p.id,
                created_at=p.created_at,
                top_career=top_career,
                summary=summary
            )
        )

    return history_list

@router.get("/{prediction_id}", response_model=PredictionDetail)
async def get_prediction_detail(
    prediction_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_token)
):
    user = await get_current_user_db(request, db)

    result = await db.execute(
        select(Prediction).filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
    )
    prediction = result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")
    
    return prediction
