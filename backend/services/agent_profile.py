import json
import re
from collections import OrderedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Prediction, Resume, User, UserPreference

KNOWN_SKILLS = (
    "python", "react", "java", "sql", "fastapi", "django", "flask", "node", "node.js",
    "javascript", "typescript", "aws", "azure", "gcp", "docker", "kubernetes",
    "machine learning", "deep learning", "pytorch", "tensorflow", "nlp", "data analysis",
    "power bi", "tableau", "postgresql", "mysql", "mongodb", "redis", "git",
)

ROLE_ALIASES = {
    "backend software engineer": [
        "Backend Engineer",
        "Backend Developer",
        "Python Backend Developer",
        "API Developer",
    ],
    "full-stack software engineer": [
        "Full Stack Developer",
        "Software Engineer",
        "MERN Stack Developer",
        "Web Developer",
    ],
    "frontend software engineer": [
        "Frontend Developer",
        "Frontend Engineer",
        "React Developer",
        "UI Engineer",
    ],
    "ai/ml engineer": [
        "AI Engineer",
        "ML Engineer",
        "Machine Learning Engineer",
        "Applied AI Engineer",
    ],
    "data analyst": [
        "Data Analyst",
        "Business Analyst",
        "BI Analyst",
        "Product Analyst",
    ],
    "data scientist": [
        "Data Scientist",
        "Machine Learning Scientist",
        "Applied Scientist",
        "Analytics Scientist",
    ],
    "devops engineer": [
        "DevOps Engineer",
        "Platform Engineer",
        "Cloud Engineer",
        "Site Reliability Engineer",
    ],
}


def _split_text_list(value: str | None) -> list[str]:
    if not value:
        return []
    parts = re.split(r"[\n,;/|]+", value)
    return [part.strip() for part in parts if part.strip()]


def _parse_json_list(value: str | None) -> list[str]:
    if not value:
        return []

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return _split_text_list(value)

    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    if isinstance(parsed, str):
        return _split_text_list(parsed)
    return []


def _unique_keep_order(values: list[str]) -> list[str]:
    return list(OrderedDict.fromkeys(value.strip() for value in values if value and value.strip()))


def _infer_skills_from_text(text: str | None) -> list[str]:
    lowered = (text or "").lower()
    skills = []
    for skill in KNOWN_SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", lowered):
            skills.append(skill)
    return _unique_keep_order(skills)


def expand_role_queries(base_roles: list[str], max_queries: int = 8) -> list[str]:
    expanded_roles: list[str] = []

    for role in base_roles:
        normalized = role.strip()
        if not normalized:
            continue

        lowered = normalized.lower()
        aliases = []
        if lowered in ROLE_ALIASES:
            aliases.extend(ROLE_ALIASES[lowered])
        else:
            for key, options in ROLE_ALIASES.items():
                if key in lowered or lowered in key:
                    aliases.extend(options)

        expanded_roles.append(normalized)
        expanded_roles.extend(aliases)

        if "Engineer" in normalized and "Developer" not in normalized:
            expanded_roles.append(normalized.replace("Engineer", "Developer"))
        if "developer" in lowered and "Engineer" not in normalized:
            expanded_roles.append(normalized.replace("Developer", "Engineer"))

    return _unique_keep_order(expanded_roles)[:max_queries]


async def get_latest_resume(user_id: int, db: AsyncSession) -> Resume | None:
    result = await db.execute(
        select(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.uploaded_at.desc())
    )
    return result.scalars().first()


async def get_latest_prediction(user_id: int, db: AsyncSession) -> Prediction | None:
    result = await db.execute(
        select(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
    )
    return result.scalars().first()


async def get_candidate_profile(user: User, db: AsyncSession) -> dict:
    latest_resume = await get_latest_resume(user.id, db)
    latest_prediction = await get_latest_prediction(user.id, db)

    resume_text = latest_resume.resume_text if latest_resume and latest_resume.resume_text else ""
    personality_data = latest_prediction.personality_data if latest_prediction else {}
    prediction_result = latest_prediction.prediction_result if latest_prediction else {}

    target_roles = []
    strengths = []
    interests = []
    profile_skills = []

    if isinstance(personality_data, dict):
        target_roles.extend(_split_text_list(personality_data.get("Target Roles")))
        strengths.extend(_split_text_list(personality_data.get("Strengths")))
        interests.extend(_split_text_list(personality_data.get("Interests")))
        profile_skills.extend(_split_text_list(personality_data.get("Skills")))

    careers = prediction_result.get("careers", []) if isinstance(prediction_result, dict) else []
    for career in careers[:4]:
        title = career.get("title")
        if title:
            target_roles.append(title)

    resume_skills = _infer_skills_from_text(resume_text)

    return {
        "name": user.email.split("@")[0],
        "skills": _unique_keep_order(profile_skills + resume_skills)[:16],
        "experience_years": 0,
        "current_role": "",
        "target_roles": _unique_keep_order(target_roles)[:8],
        "strengths": _unique_keep_order(strengths + interests)[:8],
        "resume_text": resume_text,
    }


async def derive_agent_search_roles(
    user: User,
    db: AsyncSession,
    explicit_role: str | None = None,
    max_roles: int = 8,
) -> list[str]:
    prefs_result = await db.execute(select(UserPreference).filter(UserPreference.user_id == user.id))
    prefs = prefs_result.scalars().first()
    candidate = await get_candidate_profile(user, db)

    base_roles: list[str] = []
    if explicit_role and explicit_role.strip():
        base_roles.append(explicit_role.strip())

    if prefs:
        base_roles.extend(_parse_json_list(prefs.target_roles))

    base_roles.extend(candidate.get("target_roles", []))

    if not base_roles:
        skills = set(candidate.get("skills", []))
        if {"python", "fastapi", "django", "flask"} & skills:
            base_roles.append("Backend Engineer")
        if {"react", "javascript", "typescript"} & skills:
            base_roles.append("Frontend Engineer")
        if {"machine learning", "tensorflow", "pytorch", "nlp"} & skills:
            base_roles.append("AI Engineer")
        if {"sql", "data analysis", "power bi", "tableau"} & skills:
            base_roles.append("Data Analyst")

    if not base_roles:
        base_roles.append("Software Engineer")

    return expand_role_queries(_unique_keep_order(base_roles), max_queries=max_roles)
