import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# Supabase PostgreSQL connection (Direct connection URL, port 5432)
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "SUPABASE_DB_URL is not set in backend/.env. "
        "Get it from Supabase → Project Settings → Database → Connection String → URI "
        "and prefix it with 'postgresql+asyncpg://' instead of 'postgresql://'."
    )

# Ensure the asyncpg dialect is used
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    # Connection pool settings suited for Supabase's direct connection
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
