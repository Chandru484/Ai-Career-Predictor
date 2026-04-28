import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.routers import resume, predict, history, chat, resume_optimizer, mock_interview, agent
from backend.services.scheduler import start_scheduler, stop_scheduler
from backend.resume_builder.router import router as rb_router
from backend.resume_builder.ai_router import router as rb_ai_router
from backend.resume_builder.export_router import router as rb_export_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        # For production, consider using alembic for migrations.
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized.")
    logger.info("Starting APScheduler for Auto-Apply Agent...")
    start_scheduler()
    yield
    # Shutdown actions
    logger.info("Stopping APScheduler...")
    stop_scheduler()
    logger.info("Disposing database engine...")
    await engine.dispose()


app = FastAPI(
    title="AI Career Predictor API",
    description="Backend API for the AI-Based Career Predictor utilizing Gemini and Clerk.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://.*:5173|http://.*:8000|http://localhost:.*|http://127.0.0.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc), "trace": traceback.format_exc()},
    )

# API Routers
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(predict.router, prefix="/api/predict", tags=["Predict"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(resume_optimizer.router, prefix="/api/resume-optimizer", tags=["Resume Optimizer"])
app.include_router(mock_interview.router, prefix="/api/mock-interview", tags=["Mock Interview"])
app.include_router(agent.router, prefix="/api")

# Resume Builder routers (namespaced under /api/rb)
app.include_router(rb_router, prefix="/api/rb", tags=["Resume Builder"])
app.include_router(rb_ai_router, prefix="/api/rb", tags=["Resume Builder AI"])
app.include_router(rb_export_router, prefix="/api/rb", tags=["Resume Builder Export"])



if __name__ == "__main__":
    import uvicorn
    # Make sure to run this using module path from parent directory e.g.,
    # uvicorn backend.main:app --reload
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
