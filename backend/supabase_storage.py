"""
supabase_storage.py
-------------------
Supabase Storage helper using raw httpx HTTP calls.
This avoids the supabase Python SDK (which pulls in pyiceberg requiring C++ build tools).

Supabase Storage REST API:
  Upload:         POST  {url}/storage/v1/object/{bucket}/{path}
  Signed URL:     POST  {url}/storage/v1/object/sign/{bucket}/{path}

Bucket layout:
    resumes/{clerk_user_id}/{filename}
"""

import logging
import os

import httpx
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET_NAME = "resumes"


def _auth_headers() -> dict:
    return {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }


def upload_resume(file_bytes: bytes, filename: str, clerk_user_id: str) -> str:
    """
    Upload a PDF resume to Supabase Storage.

    Returns the storage path, e.g. '{clerk_user_id}/resume.pdf'.
    Raises an exception on failure.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env"
        )

    storage_path = f"{clerk_user_id}/{filename}"
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"

    headers = {
        **_auth_headers(),
        "Content-Type": "application/pdf",
        "x-upsert": "true",  # overwrite if same filename is re-uploaded
    }

    response = httpx.post(url, content=file_bytes, headers=headers, timeout=30)

    if response.status_code not in (200, 201):
        raise RuntimeError(
            f"Supabase Storage upload failed [{response.status_code}]: {response.text}"
        )

    logger.info("Uploaded resume to Supabase Storage: %s/%s", BUCKET_NAME, storage_path)
    return storage_path


def get_resume_signed_url(storage_path: str, expires_in: int = 3600) -> str | None:
    """
    Generate a short-lived signed URL for downloading a stored resume.

    Args:
        storage_path: Path inside the bucket (e.g. 'user_abc/resume.pdf').
        expires_in:   URL lifetime in seconds (default 1 hour).

    Returns the signed URL string, or None on failure.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    url = f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET_NAME}/{storage_path}"

    try:
        response = httpx.post(
            url,
            json={"expiresIn": expires_in},
            headers=_auth_headers(),
            timeout=10,
        )
        if response.status_code == 200:
            data = response.json()
            signed = data.get("signedURL") or data.get("signedUrl") or data.get("signed_url")
            if signed and not signed.startswith("http"):
                signed = f"{SUPABASE_URL}{signed}"
            return signed
    except Exception as e:
        logger.warning("Could not generate signed URL for %s: %s", storage_path, e)

    return None
