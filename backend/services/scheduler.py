"""
Daily scheduler — runs the agent pipeline for all users with auto_apply=1.
Uses APScheduler. Call start_scheduler() in your FastAPI lifespan.

Install: pip install apscheduler
"""

import asyncio
import json
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database import AsyncSessionLocal
from backend.models import User
from backend.services.agent_core import ApplicationOrchestrator
from backend.services.agent_profile import derive_agent_search_roles, get_candidate_profile
from backend.services.notify import send_application_notification
from backend.services.scrapers import scrape_all_platforms

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def run_agent_for_user(user_id: int):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User)
            .options(selectinload(User.preferences))
            .filter(User.id == user_id, User.auto_apply == 1)
        )
        user = result.scalars().first()
        if not user:
            return

        prefs = user.preferences
        location = "India"
        if prefs and prefs.locations:
            try:
                parsed_locations = json.loads(prefs.locations)
                if isinstance(parsed_locations, list) and parsed_locations:
                    location = str(parsed_locations[0]).strip() or "India"
            except json.JSONDecodeError:
                location = prefs.locations.strip() or "India"

        candidate = await get_candidate_profile(user, db)
        search_roles = await derive_agent_search_roles(user, db, max_roles=6)
        orchestrator = ApplicationOrchestrator(user, candidate, db)
        applied_jobs = []

        for role in search_roles[:4]:
            try:
                jobs = await scrape_all_platforms(role=role, location=location, max_per_platform=10)
                for job in jobs:
                    result = await orchestrator.process_job(job)
                    if result["status"] == "ready":
                        await orchestrator.update_status(result["application_id"], "applied")
                        applied_jobs.append(result)
                        logger.info("[Agent] Applied: %s @ %s", result["job_title"], result["company"])
            except Exception as exc:
                logger.error("[Agent] Error for role '%s': %s", role, exc)

        if applied_jobs and user.phone:
            await send_application_notification(user, applied_jobs)

        logger.info("[Scheduler] Completed run for user %s — %s applied", user_id, len(applied_jobs))


async def daily_agent_run():
    """Called once daily. Spawns per-user agent runs."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.auto_apply == 1))
        users = result.scalars().all()
        user_ids = [user.id for user in users]

    logger.info("[Scheduler] Daily run starting for %s users", len(user_ids))
    tasks = [run_agent_for_user(user_id) for user_id in user_ids]
    await asyncio.gather(*tasks, return_exceptions=True)


def start_scheduler():
    scheduler.add_job(
        daily_agent_run,
        CronTrigger(hour=8, minute=0),
        id="daily_agent",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[Scheduler] Started — daily agent run at 08:00")


def stop_scheduler():
    scheduler.shutdown()
