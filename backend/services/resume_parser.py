import io
import logging
import asyncio
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def _extract_text_sync(file_bytes: bytes) -> str:
    """Synchronous function to perform the actual extraction using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        full_text = []
        
        # Limit to the first 5 pages to prevent abuse from massive documents
        max_pages = min(len(reader.pages), 5) 
        
        for i in range(max_pages):
            text = reader.pages[i].extract_text()
            if text:
                full_text.append(text)
                
        # Clean and return text by joining and stripping whitespaces
        combined = "\n".join(full_text)
        cleaned = " ".join(combined.split())
        return cleaned
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        raise ValueError("Failed to extract text from the provided PDF. Please ensure it is a valid, readable PDF.")

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a given PDF file bytes using pypdf.
    Runs in a separate thread so it doesn't block the FastAPI event loop.
    """
    return await asyncio.to_thread(_extract_text_sync, file_bytes)


async def extract_text_from_upload(file_bytes: bytes, content_type: str | None = None) -> str:
    """
    Extract text from supported resume uploads.
    Supports PDF and plain text files so local uploads match the frontend copy.
    """
    normalized_content_type = (content_type or "").lower()

    if normalized_content_type == "text/plain":
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="ignore")
        return " ".join(text.split())

    return await extract_text_from_pdf(file_bytes)
