"""
FastAPI routers:
  POST /api/agent/scrape          — trigger job scrape for a user
  POST /api/agent/run             — run full agent pipeline for scraped jobs
  GET  /api/agent/applications    — list applications (for dashboard)
  GET  /api/agent/stats           — summary counts (for dashboard)
  PATCH /api/agent/applications/{id}/status — manually update status
  PATCH /api/agent/settings       — update user agent settings
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import verify_token
from backend.database import get_db
from backend.models import Application, JobListing, User, UserPreference
from backend.services.agent_core import ApplicationOrchestrator
from backend.services.agent_profile import derive_agent_search_roles, get_candidate_profile
from backend.services.scrapers import ScrapedJob, scrape_all_platforms

router = APIRouter(prefix="/agent", tags=["agent"])


async def get_current_user(request: Request, db: AsyncSession) -> User:
    clerk_id = request.state.user_id
    result = await db.execute(select(User).filter(User.clerk_user_id == clerk_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user


class ScrapeRequest(BaseModel):
    role: str = ""
    location: str = "India"
    max_jobs: int = 20


class RunAgentRequest(BaseModel):
    jobs: list[dict]


class UpdateStatusRequest(BaseModel):
    status: str
    error: Optional[str] = None


class AgentSettingsRequest(BaseModel):
    auto_apply: Optional[int] = None
    daily_limit: Optional[int] = None
    min_score: Optional[int] = None
    phone: Optional[str] = None
    linkedin_cookie: Optional[str] = None
    indeed_cookie: Optional[str] = None


class AutoRunRequest(BaseModel):
    location: str = "India"
    max_jobs: int = 20


@router.post("/scrape")
async def scrape_jobs(
    req: ScrapeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    search_roles = await derive_agent_search_roles(user, db, explicit_role=req.role, max_roles=6)
    jobs_per_role = max(3, req.max_jobs // max(len(search_roles), 1))

    raw_jobs: list[ScrapedJob] = []
    seen_urls: set[str] = set()

    for role in search_roles:
        role_jobs = await scrape_all_platforms(
            role=role,
            location=req.location,
            max_per_platform=jobs_per_role,
        )
        for job in role_jobs:
            if isinstance(job, dict):
                job = ScrapedJob(**job)
            if job.url in seen_urls:
                continue
            seen_urls.add(job.url)
            raw_jobs.append(job)
            if len(raw_jobs) >= req.max_jobs:
                break
        if len(raw_jobs) >= req.max_jobs:
            break

    new_jobs = []
    for job in raw_jobs:
        url_hash = JobListing.make_hash(job.url)
        result = await db.execute(select(JobListing).filter(JobListing.url_hash == url_hash))
        existing = result.scalars().first()
        if existing:
            app_res = await db.execute(
                select(Application).filter(Application.user_id == user.id, Application.job_id == existing.id)
            )
            if app_res.scalars().first():
                continue
        new_jobs.append({
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "url": job.url,
            "description": job.description,
            "platform": job.platform,
            "easy_apply": job.easy_apply,
        })

    return {"total": len(new_jobs), "jobs": new_jobs, "search_roles": search_roles}


@router.post("/run")
async def run_agent(
    req: RunAgentRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    if user.auto_apply != 1:
        raise HTTPException(status_code=403, detail="Auto-apply is disabled for this user")

    candidate = await get_candidate_profile(user, db)
    orchestrator = ApplicationOrchestrator(user, candidate, db)

    results = []
    for job_dict in req.jobs:
        job = ScrapedJob(**job_dict)
        result = await orchestrator.process_job(job)
        results.append(result)

    applied = sum(1 for result in results if result["status"] == "ready")
    skipped = sum(1 for result in results if result["status"] == "skipped")
    dupes = sum(1 for result in results if result["status"] == "duplicate")

    return {
        "summary": {"ready": applied, "skipped": skipped, "duplicates": dupes},
        "results": results,
    }


@router.post("/auto-run")
async def auto_run_agent(
    req: AutoRunRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    if user.auto_apply != 1:
        raise HTTPException(status_code=403, detail="Auto-apply is disabled for this user")

    prefs_res = await db.execute(select(UserPreference).filter(UserPreference.user_id == user.id))
    prefs = prefs_res.scalars().first()
    if not prefs or not prefs.linkedin_cookie:
        raise HTTPException(status_code=400, detail="Save a LinkedIn li_at cookie before enabling auto-apply.")

    candidate = await get_candidate_profile(user, db)
    if not candidate.get("resume_text"):
        raise HTTPException(status_code=400, detail="Upload a resume first so the agent can match jobs to your profile.")

    search_roles = await derive_agent_search_roles(user, db, max_roles=6)
    jobs_per_role = max(3, req.max_jobs // max(len(search_roles), 1))
    orchestrator = ApplicationOrchestrator(user, candidate, db)

    raw_jobs: list[ScrapedJob] = []
    seen_urls: set[str] = set()
    for role in search_roles:
        role_jobs = await scrape_all_platforms(
            role=role,
            location=req.location,
            max_per_platform=jobs_per_role,
        )
        for job in role_jobs:
            if isinstance(job, dict):
                job = ScrapedJob(**job)
            if job.url in seen_urls:
                continue
            seen_urls.add(job.url)
            raw_jobs.append(job)
            if len(raw_jobs) >= req.max_jobs:
                break
        if len(raw_jobs) >= req.max_jobs:
            break

    results = []
    for job in raw_jobs:
        url_hash = JobListing.make_hash(job.url)
        result = await db.execute(select(JobListing).filter(JobListing.url_hash == url_hash))
        existing = result.scalars().first()
        if existing:
            app_res = await db.execute(
                select(Application).filter(Application.user_id == user.id, Application.job_id == existing.id)
            )
            if app_res.scalars().first():
                continue
        outcome = await orchestrator.process_job(job)
        results.append(outcome)

    applied = sum(1 for result in results if result["status"] == "ready")
    skipped = sum(1 for result in results if result["status"] == "skipped")
    duplicates = sum(1 for result in results if result["status"] == "duplicate")
    failed = sum(1 for result in results if result["status"] == "failed")
    pending = sum(1 for result in results if result["status"] == "pending")

    return {
        "summary": {
            "ready": applied,
            "skipped": skipped,
            "duplicates": duplicates,
            "failed": failed,
            "pending": pending,
        },
        "search_roles": search_roles,
        "jobs_considered": len(raw_jobs),
        "results": results,
    }


@router.get("/applications")
async def list_applications(
    request: Request,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    days: int = 30,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    since = datetime.utcnow() - timedelta(days=days)

    query = select(Application, JobListing).join(JobListing).filter(
        Application.user_id == user.id,
        Application.created_at >= since,
    )

    if status:
        query = query.filter(Application.status == status)
    if platform:
        query = query.filter(JobListing.platform == platform)

    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    apps_res = await db.execute(query.order_by(Application.created_at.desc()).offset(offset).limit(limit))
    rows = apps_res.all()

    return {
        "total": total,
        "applications": [
            {
                "id": application.id,
                "status": application.status,
                "match_score": application.match_score,
                "match_reason": application.match_reason,
                "cover_letter": application.cover_letter,
                "skip_reason": application.skip_reason,
                "error": application.error_message,
                "retry_count": application.retry_count,
                "applied_at": application.applied_at.isoformat() if application.applied_at else None,
                "created_at": application.created_at.isoformat(),
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "url": job.url,
                    "platform": job.platform,
                    "easy_apply": job.easy_apply,
                },
            }
            for application, job in rows
        ],
    }


@router.get("/stats")
async def get_stats(request: Request, db: AsyncSession = Depends(get_db), _=Depends(verify_token)):
    user = await get_current_user(request, db)
    prefs_res = await db.execute(select(UserPreference).filter(UserPreference.user_id == user.id))
    prefs = prefs_res.scalars().first()
    today = datetime.utcnow().date()
    today_start = datetime(today.year, today.month, today.day)

    async def count(status_value: str, since: datetime | None = None):
        query = select(func.count(Application.id)).filter(
            Application.user_id == user.id,
            Application.status == status_value,
        )
        if since:
            query = query.filter(Application.created_at >= since)
        result = await db.execute(query)
        return result.scalar() or 0

    total_applied = await count("applied")
    total_skipped = await count("skipped")
    total_failed = await count("failed")
    today_applied = await count("applied", today_start)
    total_pending = await count("pending")

    avg_query = select(func.avg(Application.match_score)).filter(
        Application.user_id == user.id,
        Application.status.in_(["applied", "pending"]),
    )
    avg_res = await db.execute(avg_query)
    avg_score = avg_res.scalar()

    return {
        "total_applied": total_applied,
        "total_skipped": total_skipped,
        "total_failed": total_failed,
        "total_pending": total_pending,
        "today_applied": today_applied,
        "daily_limit": user.daily_limit or 10,
        "avg_score": round(avg_score or 0, 1),
        "auto_apply_on": bool(user.auto_apply),
        "linkedin_cookie": "set" if prefs and prefs.linkedin_cookie else None,
        "indeed_cookie": "set" if prefs and prefs.indeed_cookie else None,
    }


@router.patch("/applications/{app_id}/status")
async def update_application_status(
    app_id: int,
    req: UpdateStatusRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    await get_current_user(request, db)
    result = await db.execute(select(Application).filter(Application.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = req.status
    if req.status == "applied":
        app.applied_at = datetime.utcnow()
    if req.error:
        app.error_message = req.error
    await db.commit()
    return {"id": app_id, "status": app.status}


@router.patch("/settings")
async def update_agent_settings(
    req: AgentSettingsRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _=Depends(verify_token),
):
    user = await get_current_user(request, db)
    prefs_res = await db.execute(select(UserPreference).filter(UserPreference.user_id == user.id))
    prefs = prefs_res.scalars().first()
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
        await db.flush()

    if req.auto_apply is not None:
        user.auto_apply = req.auto_apply
    if req.daily_limit is not None:
        user.daily_limit = req.daily_limit
    if req.min_score is not None:
        user.min_score = req.min_score
    if req.phone is not None:
        user.phone = req.phone
    if req.linkedin_cookie is not None:
        prefs.linkedin_cookie = req.linkedin_cookie
    if req.indeed_cookie is not None:
        prefs.indeed_cookie = req.indeed_cookie

    await db.commit()
    return {
        "auto_apply": bool(user.auto_apply),
        "daily_limit": user.daily_limit,
        "min_score": user.min_score,
        "phone": user.phone,
        "linkedin_cookie": "set" if prefs.linkedin_cookie else None,
        "indeed_cookie": "set" if prefs.indeed_cookie else None,
    }
