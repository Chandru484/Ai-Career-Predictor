"""
main.py — add these changes to your existing Career AI FastAPI app.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from career_ai.models.database import init_db
from career_ai.routers.agent import router as agent_router
from career_ai.agent.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()           # create tables if not exist
    start_scheduler()   # start daily 8AM cron
    yield
    stop_scheduler()


app = FastAPI(title="Career AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routers
# app.include_router(resume_router)
# app.include_router(matcher_router)
# app.include_router(chatbot_router)

# New agent router
app.include_router(agent_router)
