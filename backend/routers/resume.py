import logging
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.auth import verify_token
from backend.database import get_db
from backend.models import Resume, User
from backend.schemas import ResumeDetailResponse, ResumeUploadResponse
from backend.services.resume_parser import extract_text_from_upload
from backend.supabase_storage import upload_resume

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("/latest", response_model=ResumeDetailResponse)
async def get_latest_resume_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_token),
):
    clerk_user_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="No user account found for this session.")

    resume_result = await db.execute(
        select(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.uploaded_at.desc())
    )
    latest_resume = resume_result.scalars().first()
    if not latest_resume:
        raise HTTPException(status_code=404, detail="No resume uploaded yet.")

    return ResumeDetailResponse(
        resume_id=latest_resume.id,
        file_name=latest_resume.file_name,
        resume_text=latest_resume.resume_text or "",
        storage_path=latest_resume.storage_path,
        uploaded_at=latest_resume.uploaded_at,
    )


@router.post("", response_model=ResumeUploadResponse)
async def upload_resume_endpoint(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _ = Depends(verify_token),
):
    """
    Upload a resume. The file is:
    1. Parsed to extract plaintext.
    2. Stored in Supabase Storage under resumes/{clerk_user_id}/{filename}.
    3. Saved as a Resume record in the database.

    Returns the resume_id and parsed resume_text for use in predictions.
    """
    allowed_content_types = {"application/pdf", "text/plain"}
    if file.content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB.")

    # ── 1. Parse resume text ────────────────────────────────────────────────
    # ── 1. Parse resume text ────────────────────────────────────────────────
    try:
        resume_text = await extract_text_from_upload(file_bytes, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Resume extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process the uploaded resume.")

    clerk_user_id = request.state.user_id
    email = getattr(request.state, "email", f"{clerk_user_id}@placeholder.com")

    # ── 2. Ensure user exists ───────────────────────────────────────────────
    try:
        result = await db.execute(select(User).filter(User.clerk_user_id == clerk_user_id))
        user = result.scalars().first()
        if not user:
            user = User(clerk_user_id=clerk_user_id, email=email)
            db.add(user)
            await db.commit()
            await db.refresh(user)
    except Exception as e:
        logger.error(f"Database error looking up user: {e}")
        raise HTTPException(status_code=500, detail="Database error. Please try again.")

    # ── 3. Upload PDF to Supabase Storage ──────────────────────────────────
    storage_path: str | None = None
    try:
        storage_path = upload_resume(file_bytes, file.filename or "resume.pdf", clerk_user_id)
    except Exception as e:
        # Storage upload is non-critical — log and continue without it
        logger.warning("Supabase Storage upload failed (will proceed without it): %s", e)

    # ── 4. Persist Resume record ────────────────────────────────────────────
    resume_record = Resume(
        user_id=user.id,
        file_name=file.filename or "resume.pdf",
        storage_path=storage_path,
        resume_text=resume_text,
    )
    db.add(resume_record)
    await db.commit()
    await db.refresh(resume_record)

    logger.info(
        "Resume saved: id=%s user=%s storage_path=%s",
        resume_record.id,
        clerk_user_id,
        storage_path,
    )

    return ResumeUploadResponse(
        resume_id=resume_record.id,
        file_name=resume_record.file_name,
        resume_text=resume_record.resume_text or "",
        storage_path=resume_record.storage_path,
        uploaded_at=resume_record.uploaded_at,
    )
