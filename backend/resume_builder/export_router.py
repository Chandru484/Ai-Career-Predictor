"""
PDF and DOCX export endpoints for the Resume Builder.
Routes: /api/rb/export/*
"""
import io
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.auth import verify_token
from backend.resume_builder.services.pdf_service import render_pdf
from backend.resume_builder.services.docx_service import render_docx

router = APIRouter()
logger = logging.getLogger(__name__)


class ExportRequest(BaseModel):
    title: str = "resume"
    template_name: str = "universal"
    theme_color: str = "#6366f1"
    font_size: str = "medium"
    spacing: str = "normal"
    show_decorations: bool = True
    section_order: list = ["personal", "summary", "experience", "education", "skills", "projects"]
    content: Dict[str, Any] = {}


@router.post("/export/pdf")
async def export_pdf(
    body: ExportRequest,
    _=Depends(verify_token),
):
    """Render a PDF using ReportLab and return it as a binary stream."""
    try:
        pdf_bytes = render_pdf(body.model_dump())
        filename = f"{body.title.replace(' ', '_')}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.error("PDF export failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"PDF export failed: {exc}")


@router.post("/export/docx")
async def export_docx(
    body: ExportRequest,
    _=Depends(verify_token),
):
    """Render a DOCX using python-docx and return it as a binary stream."""
    try:
        docx_bytes = render_docx(body.model_dump())
        filename = f"{body.title.replace(' ', '_')}.docx"
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.error("DOCX export failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {exc}")
