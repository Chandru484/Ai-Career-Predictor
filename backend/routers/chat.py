from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import verify_token
from backend.database import get_db
from backend.models import ChatMessage, Prediction, User
from backend.schemas import ChatMessageCreate, ChatMessageItem, ChatReplyResponse
from backend.services.gemini_service import generate_chat_reply
from backend.services.prompt_builder import build_chat_prompt

router = APIRouter()


async def get_current_user(request: Request, db: AsyncSession) -> User:
    clerk_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user


@router.get("/{prediction_id}", response_model=list[ChatMessageItem])
async def get_chat_messages(
    prediction_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)

    prediction_result = await db.execute(
        select(Prediction).filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
    )
    prediction = prediction_result.scalars().first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")

    message_result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.prediction_id == prediction_id, ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    )
    return message_result.scalars().all()


@router.post("", response_model=ChatReplyResponse)
async def chat_with_assistant(
    payload: ChatMessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user = await get_current_user(request, db)

    prediction_result = await db.execute(
        select(Prediction).filter(Prediction.id == payload.prediction_id, Prediction.user_id == user.id)
    )
    prediction = prediction_result.scalars().first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found or access denied.")

    existing_messages_result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.prediction_id == payload.prediction_id, ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    )
    existing_messages = existing_messages_result.scalars().all()
    conversation = [{"role": message.role, "content": message.content} for message in existing_messages]

    user_message = ChatMessage(
        user_id=user.id,
        prediction_id=prediction.id,
        role="user",
        content=message_text
    )
    db.add(user_message)
    await db.flush()

    prompt = build_chat_prompt(
        prediction.personality_data or {},
        prediction.resume_text or "",
        prediction.prediction_result or {},
        conversation + [{"role": "user", "content": message_text}],
        message_text,
    )

    try:
        reply = await generate_chat_reply(prompt, user_message=message_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate assistant reply: {e}")

    assistant_message = ChatMessage(
        user_id=user.id,
        prediction_id=prediction.id,
        role="assistant",
        content=reply or "I couldn't generate a useful response just now. Please try again."
    )
    db.add(assistant_message)
    await db.commit()

    updated_messages_result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.prediction_id == payload.prediction_id, ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    )
    updated_messages = updated_messages_result.scalars().all()

    return ChatReplyResponse(reply=assistant_message.content, messages=updated_messages)
