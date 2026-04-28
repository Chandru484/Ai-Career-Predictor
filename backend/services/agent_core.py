"""
Career AI — Agent Core
Orchestrates: match scoring → content generation → application tracking.
Connects to your existing Career AI resume parser and role matcher.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from anthropic import Anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.models import Application, JobListing, User, UserPreference
from backend.services.scrapers import ScrapedJob
from backend.services.platform_apply import apply_linkedin_easy

logger  = logging.getLogger(__name__)
client  = Anthropic()
MODEL   = "claude-sonnet-4-20250514"


# ── Match Scoring ──────────────────────────────────────────────────────────────

def score_job_match(candidate: dict, job: ScrapedJob) -> dict:
    """
    Use Claude to score how well the candidate fits a job.
    candidate: structured profile dict from your existing Career AI parser.
    Returns {"score": int, "reason": str}
    """
    prompt = f"""
You are a career matching expert. Score how well this candidate fits the job.

CANDIDATE:
Name: {candidate.get('name', 'N/A')}
Skills: {', '.join(candidate.get('skills', []))}
Experience: {candidate.get('experience_years', 0)} years
Current/Last Role: {candidate.get('current_role', 'N/A')}
Target Roles: {', '.join(candidate.get('target_roles', []))}
Strengths: {', '.join(candidate.get('strengths', []))}

JOB:
Title: {job.title}
Company: {job.company}
Location: {job.location}
Description: {job.description[:1500]}

Score from 0-100 based on:
- Skill alignment (40%)
- Experience level match (30%)
- Role/title relevance (20%)
- Location match (10%)

Respond ONLY with valid JSON, no markdown:
{{"score": <integer 0-100>, "reason": "<one sentence explaining the score>"}}
"""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text.strip())
    except Exception as e:
        logger.error(f"Match scoring failed: {e}")
        return {"score": 0, "reason": "Scoring error"}


# ── Cover Letter Generation ────────────────────────────────────────────────────

def generate_cover_letter(
    candidate: dict,
    job: ScrapedJob,
    keyword_gaps: list[str] = [],
) -> str:
    """
    Generate a tailored cover letter using the candidate profile and JD.
    keyword_gaps: missing ATS keywords from your optimizer — woven into the letter.
    """
    keywords_instruction = ""
    if keyword_gaps:
        keywords_instruction = (
            f"\nNaturally weave in these keywords the JD emphasizes but the resume lacks: "
            f"{', '.join(keyword_gaps[:6])}."
        )

    prompt = f"""
Write a professional cover letter for this job application.

CANDIDATE: {candidate.get('name', 'N/A')}
Skills: {', '.join(candidate.get('skills', [])[:12])}
Experience: {candidate.get('experience_years', 0)} years in {candidate.get('current_role', 'tech')}
Strengths: {', '.join(candidate.get('strengths', [])[:4])}

JOB: {job.title} at {job.company} ({job.location})
JD excerpt: {job.description[:800]}
{keywords_instruction}

RULES:
- 3 paragraphs, max 220 words total
- Open with a specific hook about {job.company} or the role — no "I am writing to express"
- Paragraph 2: 2 concrete examples matching their requirements
- Paragraph 3: confident close with clear next step
- First person, active voice, zero filler phrases
- Do NOT include subject line or date — body only
"""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}")
        return ""


# ── Custom Question Answering ──────────────────────────────────────────────────

def answer_application_question(
    question: str,
    candidate: dict,
    job: ScrapedJob,
) -> str:
    """
    Answer a custom application question (LinkedIn / Greenhouse / Workday forms).
    Reuses your mock interview generation logic in reverse.
    """
    prompt = f"""
Answer this job application question for {candidate.get('name', 'N/A')}.

Question: "{question}"
Applying for: {job.title} at {job.company}
Candidate skills: {', '.join(candidate.get('skills', [])[:10])}
Experience: {candidate.get('experience_years', 0)} years
Strengths: {', '.join(candidate.get('strengths', [])[:3])}

Write 2-3 sentences. First person. Specific to the candidate's background.
Be direct — no "Great question" or "I believe" filler.
"""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Custom Q answer failed: {e}")
        return ""


# ── Application Orchestrator ───────────────────────────────────────────────────

class ApplicationOrchestrator:
    """
    Main agent loop. For each job:
    1. Score match against candidate
    2. Skip or proceed based on threshold
    3. Generate cover letter + answers
    4. Save job listing to DB
    5. Record application status
    """

    def __init__(self, user: User, candidate: dict, db: AsyncSession):
        self.user      = user
        self.candidate = candidate
        self.db        = db
        self.threshold = user.min_score or 0
        self.limit     = user.daily_limit or 10

    async def _count_today_applied(self) -> int:
        today = datetime.utcnow().date()
        result = await self.db.execute(
            select(func.count(Application.id))
            .filter(
                Application.user_id  == self.user.id,
                Application.status   == "applied",
                Application.applied_at >= datetime(today.year, today.month, today.day),
            )
        )
        return result.scalar() or 0

    async def _already_applied(self, url_hash: str) -> bool:
        result = await self.db.execute(select(JobListing).filter(JobListing.url_hash == url_hash))
        job = result.scalars().first()
        if not job:
            return False
        app_res = await self.db.execute(
            select(Application).filter(
                Application.user_id == self.user.id,
                Application.job_id  == job.id,
            )
        )
        return app_res.scalars().first() is not None

    async def _save_job(self, job: ScrapedJob) -> JobListing:
        url_hash = JobListing.make_hash(job.url)
        res = await self.db.execute(select(JobListing).filter(JobListing.url_hash == url_hash))
        existing = res.scalars().first()
        if existing:
            return existing
        db_job = JobListing(
            url_hash    = url_hash,
            url         = job.url,
            title       = job.title,
            company     = job.company,
            location    = job.location,
            description = job.description,
            platform    = job.platform,
            easy_apply  = str(job.easy_apply),
        )
        self.db.add(db_job)
        await self.db.commit()
        await self.db.refresh(db_job)
        return db_job

    async def process_job(
        self,
        job: ScrapedJob,
        keyword_gaps: list[str] = [],
    ) -> dict:
        """
        Process a single job listing through the full agent pipeline.
        Returns a result dict with status and details.
        """
        url_hash = JobListing.make_hash(job.url)

        # Deduplication check
        if await self._already_applied(url_hash):
            return {"status": "duplicate", "job": job.url}

        # Daily limit check
        if await self._count_today_applied() >= self.limit:
            return {"status": "limit_reached", "job": job.url}

        # Match scoring
        match  = score_job_match(self.candidate, job)
        score  = match.get("score", 0)
        reason = match.get("reason", "")

        db_job = await self._save_job(job)

        if score < self.threshold:
            app = Application(
                user_id     = self.user.id,
                job_id      = db_job.id,
                status      = "skipped",
                match_score = score,
                match_reason= reason,
                skip_reason = f"Score {score} below threshold {self.threshold}",
            )
            self.db.add(app)
            await self.db.commit()
            return {"status": "skipped", "score": score, "job": job.url}

        # Generate cover letter
        cover_letter = generate_cover_letter(self.candidate, job, keyword_gaps)

        # Pull user preferences for authentication cookies
        prefs_res = await self.db.execute(select(UserPreference).filter(UserPreference.user_id == self.user.id))
        user_prefs = prefs_res.scalars().first()

        applied_status = "pending"
        apply_error    = None
        
        # --- Attempt Automated Browser Application via Playwright ---
        if job.platform == "linkedin" and str(job.easy_apply) == "True":
            if user_prefs and user_prefs.linkedin_cookie:
                logger.info(f"[Orchestrator] Firing LinkedIn Auto-Apply for {job.title}")
                res = await apply_linkedin_easy(job.url, user_prefs.linkedin_cookie, self.candidate, cover_letter)
                if res["success"]:
                    applied_status = "applied"
                else:
                    applied_status = "failed"
                    apply_error = res.get("error", "Failed via Playwright")
            else:
                apply_error = "Missing LinkedIn session cookie."

        app = Application(
            user_id      = self.user.id,
            job_id       = db_job.id,
            status       = applied_status,
            match_score  = score,
            match_reason = reason,
            cover_letter = cover_letter,
            error_message= apply_error
        )
        if applied_status == "applied":
            app.applied_at = datetime.utcnow()

        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)

        return {
            "status":       "ready" if applied_status == "applied" else applied_status,
            "application_id": app.id,
            "score":        score,
            "reason":       reason,
            "cover_letter": cover_letter,
            "job":          job.url,
            "job_title":    job.title,
            "company":      job.company,
            "easy_apply":   job.easy_apply,
        }

    async def update_status(
        self,
        application_id: int,
        status: str,               # "applied" / "failed"
        error: Optional[str] = None,
    ):
        result = await self.db.execute(select(Application).filter(Application.id == application_id))
        app = result.scalars().first()
        if not app:
            return
        app.status = status
        if status == "applied":
            app.applied_at = datetime.utcnow()
        if error:
            app.error_message = error
            app.retry_count  += 1
        await self.db.commit()
