"""
CRUD router for Resume Builder documents.
Routes: /api/rb/resumes/*
"""
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import verify_token
from backend.database import get_db
from backend.resume_builder.models import (
    ResumeDocument,
    ResumeDocumentCreate,
    ResumeDocumentResponse,
    ResumeDocumentUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_user_id(request: Request) -> str:
    return request.state.user_id


# ── List all resumes ─────────────────────────────────────────────────────────

@router.get("/resumes", response_model=List[ResumeDocumentResponse])
async def list_resumes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    result = await db.execute(
        select(ResumeDocument)
        .where(ResumeDocument.user_clerk_id == uid)
        .order_by(ResumeDocument.updated_at.desc())
    )
    docs = result.scalars().all()
    return [ResumeDocumentResponse.from_orm_model(d) for d in docs]


# ── Create resume ─────────────────────────────────────────────────────────────

@router.post("/resumes", response_model=ResumeDocumentResponse, status_code=201)
async def create_resume(
    request: Request,
    body: ResumeDocumentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    doc = ResumeDocument(
        id=str(uuid.uuid4()),
        user_clerk_id=uid,
        title=body.title,
        template_name=body.template_name,
        theme_color=body.theme_color,
        font_size=body.font_size,
        spacing=body.spacing,
        show_decorations=1 if body.show_decorations else 0,
        section_order=body.section_order,
        content=body.content,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    logger.info("Created resume %s for user %s", doc.id, uid)
    return ResumeDocumentResponse.from_orm_model(doc)


# ── Get single resume ─────────────────────────────────────────────────────────

@router.get("/resumes/{resume_id}", response_model=ResumeDocumentResponse)
async def get_resume(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    result = await db.execute(
        select(ResumeDocument)
        .where(ResumeDocument.id == resume_id, ResumeDocument.user_clerk_id == uid)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeDocumentResponse.from_orm_model(doc)


# ── Update resume ─────────────────────────────────────────────────────────────

@router.put("/resumes/{resume_id}", response_model=ResumeDocumentResponse)
async def update_resume(
    resume_id: str,
    request: Request,
    body: ResumeDocumentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    result = await db.execute(
        select(ResumeDocument)
        .where(ResumeDocument.id == resume_id, ResumeDocument.user_clerk_id == uid)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    update_data = body.model_dump(exclude_unset=True)
    if "show_decorations" in update_data:
        update_data["show_decorations"] = 1 if update_data["show_decorations"] else 0
    for field, value in update_data.items():
        setattr(doc, field, value)

    from datetime import datetime
    doc.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(doc)
    return ResumeDocumentResponse.from_orm_model(doc)


# ── Delete resume ─────────────────────────────────────────────────────────────

@router.delete("/resumes/{resume_id}", status_code=204)
async def delete_resume(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    result = await db.execute(
        select(ResumeDocument)
        .where(ResumeDocument.id == resume_id, ResumeDocument.user_clerk_id == uid)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    await db.delete(doc)
    await db.commit()


# ── Duplicate resume ──────────────────────────────────────────────────────────

@router.post("/resumes/{resume_id}/duplicate", response_model=ResumeDocumentResponse, status_code=201)
async def duplicate_resume(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    uid = _get_user_id(request)
    result = await db.execute(
        select(ResumeDocument)
        .where(ResumeDocument.id == resume_id, ResumeDocument.user_clerk_id == uid)
    )
    original = result.scalars().first()
    if not original:
        raise HTTPException(status_code=404, detail="Resume not found")

    clone = ResumeDocument(
        id=str(uuid.uuid4()),
        user_clerk_id=uid,
        title=f"{original.title} (Copy)",
        template_name=original.template_name,
        theme_color=original.theme_color,
        font_size=original.font_size,
        spacing=original.spacing,
        show_decorations=original.show_decorations,
        section_order=list(original.section_order or []),
        content=dict(original.content or {}),
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return ResumeDocumentResponse.from_orm_model(clone)
