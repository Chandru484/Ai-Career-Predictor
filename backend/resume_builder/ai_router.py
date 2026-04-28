"""
AI-powered endpoints for the Resume Builder.
Routes: /api/rb/ai/*
Uses the existing gemini_service (Gemini + Groq fallback).
"""
from __future__ import annotations

import io
import json
import logging
import re
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from backend.auth import verify_token
from backend.services.gemini_service import (
    generate_structured_json,
    generate_chat_reply,
    _extract_json_payload,
    _generate_with_groq_fallback,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _is_ai_provider_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    patterns = [
        "all connection attempts failed",
        "api key",
        "unauthorized",
        "timed out",
        "quota",
        "rate limit",
        "model",
        "connection",
    ]
    return any(p in msg for p in patterns)


def _fallback_enhance_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if not cleaned:
        return "Led impactful initiatives with measurable results."
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    if not cleaned.endswith("."):
        cleaned += "."
    if not re.search(r"\b(achieved|improved|reduced|increased|delivered|built|developed|implemented)\b", cleaned.lower()):
        cleaned = "Delivered " + cleaned[0].lower() + cleaned[1:]
    return cleaned


def _extract_keywords(text: str) -> set[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9+.#-]{2,}", text.lower())
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "have", "your", "you",
        "our", "are", "will", "can", "all", "any", "job", "role", "team", "work",
        "years", "year", "experience", "required", "preferred", "strong", "ability",
    }
    return {w for w in words if w not in stop}


def _fallback_ats(body: ATSRequest) -> ATSResponse:
    content = body.resume_content or {}
    personal = content.get("personal", {})
    score = 35
    strengths = []
    improvements = []

    if personal.get("name") and personal.get("email"):
        score += 10
        strengths.append("Contact information is present.")
    else:
        improvements.append("Add complete contact details (name and email).")

    if content.get("summary"):
        score += 10
        strengths.append("Professional summary included.")
    else:
        improvements.append("Add a concise professional summary.")

    exp_count = len(content.get("experience", []))
    edu_count = len(content.get("education", []))
    skill_count = len(content.get("skills", []))
    proj_count = len(content.get("projects", []))

    score += min(20, exp_count * 8)
    score += min(10, edu_count * 5)
    score += min(15, skill_count)
    score += min(10, proj_count * 5)

    if exp_count == 0:
        improvements.append("Add at least one experience entry with achievement bullets.")
    if skill_count < 6:
        improvements.append("Expand skills with role-relevant keywords.")

    jd_keywords = _extract_keywords(body.job_description or "")
    resume_keywords = _extract_keywords(_resume_summary_text(content))
    missing = sorted(list(jd_keywords - resume_keywords))[:12]

    summary = "Generated with offline fallback scoring because AI provider was unavailable."
    return ATSResponse(
        score=max(0, min(100, score)),
        summary=summary,
        strengths=strengths or ["Resume structure detected."],
        improvements=improvements or ["Tailor keywords to your target role."],
        keywords_missing=missing,
    )


def _fallback_job_match(body: JobMatchRequest) -> JobMatchResponse:
    resume_keywords = _extract_keywords(_resume_summary_text(body.resume_content or {}))
    jd_keywords = _extract_keywords(body.job_description or "")
    if not jd_keywords:
        return JobMatchResponse(
            match_percent=0,
            matched_keywords=[],
            missing_keywords=[],
            suggestions=["Paste a job description to compute keyword match."],
        )

    matched = sorted(list(jd_keywords & resume_keywords))[:20]
    missing = sorted(list(jd_keywords - resume_keywords))[:20]
    pct = int(round((len(matched) / max(1, len(jd_keywords))) * 100))
    suggestions = [
        "Add 3-5 high-priority missing keywords to experience bullets.",
        "Mirror exact terms from the job description where truthful.",
    ]
    return JobMatchResponse(
        match_percent=max(0, min(100, pct)),
        matched_keywords=matched,
        missing_keywords=missing,
        suggestions=suggestions,
    )


def _fallback_cover_letter(body: CoverLetterRequest) -> CoverLetterResponse:
    personal = (body.resume_content or {}).get("personal", {})
    name = personal.get("name") or "Candidate"
    company = body.company_name or "your company"
    tone = body.tone or "professional"
    letter = (
        f"Dear Hiring Manager,\n\n"
        f"I am excited to apply for this opportunity at {company}. My background aligns well with the role requirements, "
        f"and I am confident I can contribute quickly through strong execution and collaboration.\n\n"
        f"In recent projects, I have focused on delivering measurable outcomes, improving systems, and communicating clearly "
        f"with cross-functional teams. I would welcome the chance to bring this {tone} approach to your team.\n\n"
        f"Thank you for your time and consideration. I look forward to the possibility of discussing how I can add value.\n\n"
        f"Sincerely,\n{name}"
    )
    return CoverLetterResponse(cover_letter=letter)


def _fallback_parse_from_text(raw_text: str) -> Dict[str, Any]:
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", raw_text)
    phone_match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", raw_text)
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    name = lines[0] if lines else ""

    skill_candidates = {
        "python", "java", "javascript", "typescript", "react", "node", "fastapi", "sql",
        "aws", "docker", "kubernetes", "git", "html", "css", "mongodb", "postgresql",
    }
    text_l = raw_text.lower()
    skills = sorted([s for s in skill_candidates if s in text_l])

    summary = " ".join(lines[:4])[:500]
    return {
        "personal": {
            "name": name,
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "location": "",
            "linkedin": "",
            "github": "",
            "website": "",
        },
        "summary": summary,
        "experience": [],
        "education": [],
        "skills": skills,
        "projects": [],
    }


# ── Request/Response schemas ──────────────────────────────────────────────────

class EnhanceRequest(BaseModel):
    text: str
    context: str = ""   # e.g. "work experience bullet for software engineer"

class EnhanceResponse(BaseModel):
    enhanced: str


class ATSRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_description: str = ""

class ATSResponse(BaseModel):
    score: int
    summary: str
    strengths: list
    improvements: list
    keywords_missing: list


class JobMatchRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_description: str

class JobMatchResponse(BaseModel):
    match_percent: int
    matched_keywords: list
    missing_keywords: list
    suggestions: list


class CoverLetterRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_description: str
    company_name: str = ""
    tone: str = "professional"  # professional | friendly | confident

class CoverLetterResponse(BaseModel):
    cover_letter: str


class TrimRequest(BaseModel):
    resume_content: Dict[str, Any]
    max_words: int = 600

class TrimResponse(BaseModel):
    trimmed_content: Dict[str, Any]
    words_removed: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_json(text: str) -> Dict[str, Any]:
    try:
        return _extract_json_payload(text)
    except Exception:
        return {"raw": text}


def _resume_summary_text(content: Dict[str, Any]) -> str:
    """Convert resume content dict to a readable plain-text summary for AI prompts."""
    p = content.get("personal", {})
    lines = [
        f"Name: {p.get('name', '')}",
        f"Email: {p.get('email', '')}",
        "",
        f"Summary:\n{content.get('summary', '')}",
        "",
        "Experience:",
    ]
    for exp in content.get("experience", []):
        lines.append(f"  - {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('start_date','')}–{exp.get('end_date','Present')})")
        for b in exp.get("bullets", []):
            lines.append(f"      • {b}")
    lines.append("\nEducation:")
    for edu in content.get("education", []):
        lines.append(f"  - {edu.get('degree', '')} in {edu.get('field','')} from {edu.get('institution','')}")
    lines.append("\nSkills: " + ", ".join(content.get("skills", [])))
    lines.append("\nProjects:")
    for proj in content.get("projects", []):
        lines.append(f"  - {proj.get('name', '')}: {proj.get('description','')}")
    return "\n".join(lines)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/ai/enhance", response_model=EnhanceResponse)
async def enhance_text(
    body: EnhanceRequest,
    _=Depends(verify_token),
):
    """Improve a resume bullet or summary paragraph using AI."""
    prompt = f"""You are an expert resume writer. Rewrite the following text to be more impactful, 
concise, and achievement-focused for a professional resume. Use strong action verbs. 
Context: {body.context}

Original text:
{body.text}

Return ONLY the improved text, nothing else."""
    try:
        improved = await _generate_with_groq_fallback(prompt)
        return EnhanceResponse(enhanced=improved.strip())
    except Exception as exc:
        logger.error("Enhance failed: %s", exc)
        if _is_ai_provider_error(exc):
            logger.warning("Enhance fallback activated due to AI provider issue")
            return EnhanceResponse(enhanced=_fallback_enhance_text(body.text))
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ai/parse", response_model=Dict[str, Any])
async def parse_resume_pdf(
    file: UploadFile = File(...),
    _=Depends(verify_token),
):
    """Upload a PDF resume and extract structured data via AI."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files supported")
    
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    # Extract text from PDF
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {exc}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="PDF has no extractable text")

    prompt = f"""You are a resume parser. Extract structured information from the resume text below.
Return a JSON object with this exact structure:
{{
  "personal": {{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":""}},
  "summary": "...",
  "experience": [{{"company":"","title":"","location":"","start_date":"","end_date":"","current":false,"bullets":[]}}],
  "education": [{{"institution":"","degree":"","field":"","location":"","start_date":"","end_date":"","gpa":""}}],
  "skills": [],
  "projects": [{{"name":"","description":"","technologies":"","bullets":[]}}]
}}
Return ONLY valid JSON, no markdown fences.

RESUME TEXT:
{raw_text[:8000]}"""
    
    try:
        result = await generate_structured_json(prompt)
        return result
    except Exception as exc:
        logger.error("Parse resume failed: %s", exc)
        if _is_ai_provider_error(exc):
            logger.warning("Parse fallback activated due to AI provider issue")
            return _fallback_parse_from_text(raw_text)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ai/analyze", response_model=ATSResponse)
async def analyze_ats(
    body: ATSRequest,
    _=Depends(verify_token),
):
    """Analyze resume for ATS compatibility and return a score with suggestions."""
    resume_text = _resume_summary_text(body.resume_content)
    jd_text = f"\nJob Description:\n{body.job_description}" if body.job_description else ""

    prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer. Review the resume below and give an ATS compatibility score.
{jd_text}

RESUME:
{resume_text}

Return a JSON object:
{{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "keywords_missing": ["<keyword1>", "<keyword2>"]
}}
Return ONLY valid JSON."""
    try:
        result = await generate_structured_json(prompt)
        return ATSResponse(
            score=int(result.get("score", 70)),
            summary=result.get("summary", ""),
            strengths=result.get("strengths", []),
            improvements=result.get("improvements", []),
            keywords_missing=result.get("keywords_missing", []),
        )
    except Exception as exc:
        if _is_ai_provider_error(exc):
            logger.warning("ATS fallback activated due to AI provider issue")
            return _fallback_ats(body)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ai/job-match", response_model=JobMatchResponse)
async def job_match(
    body: JobMatchRequest,
    _=Depends(verify_token),
):
    """Match resume to a job description and return match percentage + keywords."""
    resume_text = _resume_summary_text(body.resume_content)
    prompt = f"""You are a job-matching expert. Compare this resume to the job description and calculate a match percentage.

RESUME:
{resume_text}

JOB DESCRIPTION:
{body.job_description[:3000]}

Return a JSON object:
{{
  "match_percent": <integer 0-100>,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}}
Return ONLY valid JSON."""
    try:
        result = await generate_structured_json(prompt)
        return JobMatchResponse(
            match_percent=int(result.get("match_percent", 0)),
            matched_keywords=result.get("matched_keywords", []),
            missing_keywords=result.get("missing_keywords", []),
            suggestions=result.get("suggestions", []),
        )
    except Exception as exc:
        if _is_ai_provider_error(exc):
            logger.warning("Job-match fallback activated due to AI provider issue")
            return _fallback_job_match(body)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ai/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    body: CoverLetterRequest,
    _=Depends(verify_token),
):
    """Generate a tailored cover letter from resume + job context."""
    resume_text = _resume_summary_text(body.resume_content)
    company = f" at {body.company_name}" if body.company_name else ""
    prompt = f"""You are a professional cover letter writer. Write a compelling, personalized cover letter 
for the position{company}. Tone: {body.tone}.

RESUME:
{resume_text}

JOB DESCRIPTION:
{body.job_description[:2000]}

Write a 3-paragraph cover letter. Do NOT use placeholders like [Your Name]. 
Use the candidate's actual name from the resume. Return ONLY the cover letter text."""
    try:
        letter = await generate_chat_reply(prompt)
        return CoverLetterResponse(cover_letter=letter.strip())
    except Exception as exc:
        if _is_ai_provider_error(exc):
            logger.warning("Cover-letter fallback activated due to AI provider issue")
            return _fallback_cover_letter(body)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ai/trim", response_model=TrimResponse)
async def trim_resume(
    body: TrimRequest,
    _=Depends(verify_token),
):
    """Intelligently shorten a resume to fit within the max_words limit."""
    resume_text = _resume_summary_text(body.resume_content)
    current_words = len(resume_text.split())
    
    if current_words <= body.max_words:
        return TrimResponse(trimmed_content=body.resume_content, words_removed=0)

    prompt = f"""You are a professional resume editor. Shorten this resume to approximately {body.max_words} words 
while preserving the most important information. Return the same JSON structure with trimmed content.

Current resume JSON:
{json.dumps(body.resume_content)[:6000]}

Return ONLY valid JSON with the same structure but trimmed content."""
    try:
        result = await generate_structured_json(prompt)
        trimmed_text = _resume_summary_text(result)
        words_removed = max(0, current_words - len(trimmed_text.split()))
        return TrimResponse(trimmed_content=result, words_removed=words_removed)
    except Exception as exc:
        if _is_ai_provider_error(exc):
            logger.warning("Trim fallback activated due to AI provider issue")
            return TrimResponse(trimmed_content=body.resume_content, words_removed=0)
        raise HTTPException(status_code=500, detail=str(exc))
