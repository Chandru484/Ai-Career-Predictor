def build_prediction_prompt(personality_answers: dict, resume_text: str) -> str:
    """
    Builds the formatted prompt for the Gemini API.
    """
    safe_resume_text = (resume_text or "").strip()
    if len(safe_resume_text) > 6000:
        safe_resume_text = safe_resume_text[:6000]

    formatted_personality = "\n".join([f"Q: {k}\nA: {v}" for k, v in personality_answers.items()])

    prompt = f"""You are a career counselor AI. Based on the following user profile, predict the top 3 best-fit careers.

PERSONALITY & INTERESTS:
{formatted_personality}

TECHNICAL BACKGROUND (from resume):
{safe_resume_text}

Respond ONLY in JSON format with no extra text, markdown, or backticks:
{{
  "careers": [
    {{
      "title": "string",
      "match_percentage": 0,
      "reasons": ["string"],
      "skills_to_develop": ["string"]
    }}
  ],
  "summary": "string"
}}

Rules:
- Return exactly 3 careers ordered from strongest match to weakest.
- "match_percentage" must be a numeric value, not a quoted string.
- Do not include markdown fences, commentary, or any text outside the JSON object.
"""
    
    return prompt


def build_chat_prompt(
    personality_answers: dict,
    resume_text: str,
    prediction_result: dict,
    conversation: list[dict],
    user_message: str
) -> str:
    formatted_personality = "\n".join([f"- {k}: {v}" for k, v in personality_answers.items()]) or "- No profile answers provided"
    careers = prediction_result.get("careers", [])
    summary = prediction_result.get("summary", "")
    formatted_careers = "\n".join(
        [
            f"- {career.get('title', 'Unknown')}: {career.get('match_percentage', 0)}% match | "
            f"Reasons: {', '.join(career.get('reasons', [])) or 'N/A'} | "
            f"Skills to develop: {', '.join(career.get('skills_to_develop', [])) or 'N/A'}"
            for career in careers
        ]
    ) or "- No career matches available"
    history_text = "\n".join(
        [f"{item['role'].upper()}: {item['content']}" for item in conversation[-8:]]
    ) or "No prior conversation."

    return f"""You are an AI career assistant inside a career prediction app.
Your job is to help the user understand their results, choose between careers, improve their resume, and plan next steps.

Rules:
- Stay grounded in the prediction data below.
- Be practical, encouraging, and specific.
- If the user asks for a plan, give concise actionable steps.
- If the user asks about resume improvement, connect your advice to their target role.
- If something is not present in the provided profile, say it is an inference.
- Keep responses under 220 words and use plain text.

USER PROFILE:
{formatted_personality}

RESUME TEXT:
{resume_text or "No resume text provided."}

CAREER PREDICTION SUMMARY:
{summary or "No summary available."}

TOP CAREER MATCHES:
{formatted_careers}

RECENT CONVERSATION:
{history_text}

LATEST USER MESSAGE:
{user_message}
"""


def build_resume_optimizer_prompt(
    resume_text: str,
    prediction_result: dict,
    personality_answers: dict,
    target_role: str | None = None,
) -> str:
    careers = prediction_result.get("careers", [])
    selected_role = target_role or (careers[0].get("title") if careers else "Target Role")
    matching_career = next((career for career in careers if career.get("title") == selected_role), careers[0] if careers else {})
    skills_to_develop = ", ".join(matching_career.get("skills_to_develop", [])) or "Not specified"
    reasons = ", ".join(matching_career.get("reasons", [])) or "Not specified"
    formatted_personality = "\n".join([f"- {k}: {v}" for k, v in personality_answers.items()]) or "- No additional profile information"
    safe_resume_text = (resume_text or "").strip()[:7000] or "No resume text provided."

    return f"""You are an expert resume optimization assistant for tech careers.
Use the user's resume and prediction result to suggest resume improvements for the target role.

TARGET ROLE:
{selected_role}

WHY THIS ROLE MATCHES:
{reasons}

SKILLS TO DEVELOP:
{skills_to_develop}

USER PROFILE:
{formatted_personality}

RESUME TEXT:
{safe_resume_text}

Respond ONLY in valid JSON with this exact shape:
{{
  "target_role": "string",
  "professional_summary": "2-3 sentence resume summary tailored to the role",
  "missing_keywords": ["string"],
  "bullet_improvements": ["rewrite bullet 1", "rewrite bullet 2", "rewrite bullet 3"],
  "recruiter_tips": ["string", "string", "string"]
}}

Rules:
- Keep suggestions grounded in the provided resume.
- Missing keywords should be concise skill or tool phrases.
- Bullet improvements should be strong ATS-friendly resume bullet points using action verbs.
- Recruiter tips should be practical and specific.
"""


def build_mock_interview_prompt(
    resume_text: str,
    prediction_result: dict,
    personality_answers: dict,
    target_role: str | None = None,
) -> str:
    careers = prediction_result.get("careers", [])
    selected_role = target_role or (careers[0].get("title") if careers else "Target Role")
    matching_career = next((career for career in careers if career.get("title") == selected_role), careers[0] if careers else {})
    reasons = ", ".join(matching_career.get("reasons", [])) or "Not specified"
    skills_to_develop = ", ".join(matching_career.get("skills_to_develop", [])) or "Not specified"
    formatted_personality = "\n".join([f"- {k}: {v}" for k, v in personality_answers.items()]) or "- No additional profile information"
    safe_resume_text = (resume_text or "").strip()[:7000] or "No resume text provided."

    return f"""You are an expert mock interview coach for tech careers.
Create a role-specific mock interview kit grounded in the user's resume, career match reasons, and skill gaps.

TARGET ROLE:
{selected_role}

WHY THIS ROLE MATCHES:
{reasons}

SKILLS TO DEVELOP:
{skills_to_develop}

USER PROFILE:
{formatted_personality}

RESUME TEXT:
{safe_resume_text}

Respond ONLY in valid JSON with this exact shape:
{{
  "target_role": "string",
  "warmup_questions": ["string", "string", "string"],
  "technical_questions": ["string", "string", "string", "string"],
  "behavioral_questions": ["string", "string", "string"],
  "interviewer_focus": ["string", "string", "string"],
  "answer_tips": ["string", "string", "string"]
}}

Rules:
- Questions must be specific to the selected role and the user's background.
- Keep each question concise and interview-ready.
- Interviewer focus points should describe what the interviewer is likely evaluating.
- Answer tips should be practical, brief, and easy to act on.
- Do not include markdown or commentary outside the JSON object.
"""
