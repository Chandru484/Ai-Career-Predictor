"""
One-time migration script to add missing columns to the Supabase database.
Run: python migrate.py
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

import asyncpg


async def migrate():
    raw_url = os.getenv('SUPABASE_DB_URL')
    if not raw_url:
        raise RuntimeError("SUPABASE_DB_URL not found in backend/.env")

    # asyncpg needs postgresql:// not postgresql+asyncpg://
    url = raw_url.replace('postgresql+asyncpg://', 'postgresql://')
    print(f"Connecting to Supabase...")
    conn = await asyncpg.connect(url)
    print("Connected!")

    migrations = [
        # Missing columns on users table
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_apply INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 10",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS min_score INTEGER DEFAULT 75",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)",
        # Ensure resumes table has storage_path
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS storage_path VARCHAR(512)",
        # Ensure user_preferences table has cookie columns
        "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS linkedin_cookie TEXT",
        "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS indeed_cookie TEXT",
    ]

    for sql in migrations:
        try:
            await conn.execute(sql)
            print(f"  OK: {sql[:80]}")
        except Exception as e:
            print(f"  SKIP ({e}): {sql[:80]}")

    # Show all public tables
    tables = await conn.fetch(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    )
    print("\nExisting tables:", [r['tablename'] for r in tables])

    # Show users columns
    cols = await conn.fetch(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
    )
    print("\nUsers table columns:")
    for c in cols:
        print(f"  {c['column_name']} ({c['data_type']})")

    await conn.close()
    print("\nMigration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
