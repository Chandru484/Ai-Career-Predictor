import os
import json
import logging
import asyncio
import re
import time
from typing import Dict, Any, Tuple

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini configuration
# ---------------------------------------------------------------------------
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
PREDICTION_MODELS = tuple(
    model.strip()
    for model in os.getenv(
        "GEMINI_PREDICTION_MODELS",
        # Order: fastest/cheapest first; 2.5-flash as reliable fallback; 1.5-flash as last resort
        "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash,gemini-1.5-flash"
    ).split(",")
    if model.strip()
)
CHAT_MODELS = tuple(
    model.strip()
    for model in os.getenv(
        "GEMINI_CHAT_MODELS",
        "gemini-2.0-flash-lite,gemini-2.0-flash,gemini-2.5-flash-lite,gemini-1.5-flash-8b"
    ).split(",")
    if model.strip()
)
REQUEST_TIMEOUT_SECONDS = float(os.getenv("GEMINI_REQUEST_TIMEOUT_SECONDS", "35"))
MODEL_COOLDOWN_SECONDS = float(os.getenv("GEMINI_MODEL_COOLDOWN_SECONDS", "45"))
API_KEY_REDACTION = "<redacted>"
_MODEL_COOLDOWNS: Dict[str, float] = {}

# ---------------------------------------------------------------------------
# Groq configuration
# ---------------------------------------------------------------------------
GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS = tuple(
    model.strip()
    for model in os.getenv("GROQ_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",")
    if model.strip()
)
GROQ_TIMEOUT_SECONDS = float(os.getenv("GROQ_REQUEST_TIMEOUT_SECONDS", "35"))


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

def configure_gemini() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY is not set or is using dummy value.")
    return api_key or ""


def _extract_text_from_response(data: Dict[str, Any]) -> Tuple[str, str]:
    candidates = data.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            text = part.get("text")
            if text:
                return text.strip(), candidate.get("finishReason", "")
    raise Exception(f"Gemini returned no text content. Response: {json.dumps(data)[:500]}")


def _extract_json_payload(text: str) -> Dict[str, Any]:
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        raise Exception("AI returned an empty response.")

    direct_attempts = [cleaned_text]

    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned_text, re.DOTALL)
    if fenced_match:
        direct_attempts.append(fenced_match.group(1).strip())

    first_brace = cleaned_text.find("{")
    last_brace = cleaned_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        direct_attempts.append(cleaned_text[first_brace:last_brace + 1].strip())

    decoder = json.JSONDecoder()
    seen_attempts = set()
    for attempt in direct_attempts:
        if not attempt or attempt in seen_attempts:
            continue
        seen_attempts.add(attempt)
        try:
            return json.loads(attempt)
        except json.JSONDecodeError:
            try:
                parsed, _ = decoder.raw_decode(attempt)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                continue

    raise Exception(f"AI returned invalid JSON. Raw response: {cleaned_text[:600]}")


def _should_retry(error_str: str) -> bool:
    lower = error_str.lower()
    return any(token in lower for token in ["429", "quota", "timeout", "temporarily unavailable", "503", "500"])


def _sanitize_error_message(message: str) -> str:
    cleaned = re.sub(r"key=[^&\s]+", f"key={API_KEY_REDACTION}", message or "")
    cleaned = re.sub(r"https://generativelanguage\.googleapis\.com/\S+", "Gemini API URL", cleaned)
    return cleaned


def _retry_delay_seconds(exc: Exception, attempt: int) -> float:
    if isinstance(exc, httpx.HTTPStatusError):
        retry_after = exc.response.headers.get("Retry-After")
        if retry_after:
            try:
                return max(float(retry_after), 1.0)
            except ValueError:
                pass

    error_str = str(exc)
    match = re.search(r"retry in (\d+(?:\.\d+)?)s", error_str, re.IGNORECASE)
    if match:
        return float(match.group(1)) + 1

    return float(2 ** (attempt + 1))


def _is_quota_error(exc: Exception) -> bool:
    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
        return True
    message = str(exc).lower()
    return "429" in message or "too many requests" in message or "quota" in message


def _mark_model_cooldown(model_name: str, exc: Exception) -> float:
    delay_seconds = max(_retry_delay_seconds(exc, 0), MODEL_COOLDOWN_SECONDS)
    cooldown_until = time.monotonic() + delay_seconds
    current_until = _MODEL_COOLDOWNS.get(model_name, 0.0)
    _MODEL_COOLDOWNS[model_name] = max(current_until, cooldown_until)
    return _MODEL_COOLDOWNS[model_name]


def _seconds_until_available(model_name: str) -> float:
    return max(_MODEL_COOLDOWNS.get(model_name, 0.0) - time.monotonic(), 0.0)


def _prioritize_models(models: tuple) -> list:
    now = time.monotonic()
    ordered_models = []
    for index, model_name in enumerate(models):
        cooldown_until = _MODEL_COOLDOWNS.get(model_name, 0.0)
        remaining = max(cooldown_until - now, 0.0)
        ordered_models.append((remaining, index, model_name))
    ordered_models.sort(key=lambda item: (item[0], item[1]))
    return [model_name for _, _, model_name in ordered_models]


async def _request_gemini_model(
    model_name: str,
    prompt: str,
    generation_config: Dict[str, Any],
) -> Tuple[str, str]:
    api_key = configure_gemini()
    if not api_key:
        raise Exception("GEMINI_API_KEY is missing.")

    url = f"{GEMINI_API_BASE}/{model_name}:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        response = await client.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": generation_config,
            },
        )
        response.raise_for_status()
        data = response.json()
        text, finish_reason = _extract_text_from_response(data)
        logger.info("Gemini request succeeded using model %s", model_name)
        return text, finish_reason


# ---------------------------------------------------------------------------
# Groq helpers
# ---------------------------------------------------------------------------

def _configure_groq() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        logger.warning("GROQ_API_KEY is not set or is using dummy value.")
        return ""
    return api_key


async def _request_groq_model(model_name: str, prompt: str) -> str:
    """Call Groq's OpenAI-compatible chat completions endpoint."""
    api_key = _configure_groq()
    if not api_key:
        raise Exception("GROQ_API_KEY is missing — cannot use Groq fallback.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.25,
        "max_tokens": 4096,
    }

    async with httpx.AsyncClient(timeout=GROQ_TIMEOUT_SECONDS) as client:
        response = await client.post(GROQ_API_BASE, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()

    try:
        text = data["choices"][0]["message"]["content"].strip()
        logger.info("Groq request succeeded using model %s", model_name)
        return text
    except (KeyError, IndexError) as exc:
        raise Exception(f"Groq returned unexpected response structure: {json.dumps(data)[:400]}") from exc


async def _generate_with_groq_fallback(prompt: str) -> str:
    """Try each Groq model in order; raise if all fail."""
    last_error = None
    for model_name in GROQ_MODELS:
        try:
            return await _request_groq_model(model_name, prompt)
        except Exception as exc:
            last_error = f"{model_name}: {exc}"
            logger.warning("Groq request failed for model %s: %s", model_name, exc)

    raise Exception(f"All Groq fallback models failed. Last error: {last_error}")


# ---------------------------------------------------------------------------
# Unified generation with Gemini-first, Groq-fallback strategy
# ---------------------------------------------------------------------------

async def _generate_with_fallback(
    prompt: str,
    models: tuple,
    generation_config: Dict[str, Any],
) -> str:
    """
    1. Try every Gemini model (with per-model quota cooldown).
    2. If ALL Gemini models are quota-exhausted or erroring, fall back to Groq.
    """
    api_key = configure_gemini()
    if not api_key:
        logger.warning("No Gemini API key — jumping straight to Groq fallback.")
        return await _generate_with_groq_fallback(prompt)

    last_error = None
    ordered_models = _prioritize_models(models)

    # If even the best Gemini model is on cooldown, wait briefly then re-sort
    if ordered_models:
        shortest_wait = _seconds_until_available(ordered_models[0])
        if shortest_wait > 0:
            logger.info(
                "All Gemini models are cooling down. Waiting %.1fs before retrying %s.",
                shortest_wait,
                ordered_models[0],
            )
            await asyncio.sleep(shortest_wait)
            ordered_models = _prioritize_models(models)

    for model_name in ordered_models:
        max_retries = 1
        for attempt in range(max_retries + 1):
            try:
                text, finish_reason = await _request_gemini_model(model_name, prompt, generation_config)
                if finish_reason == "MAX_TOKENS":
                    raise Exception(f"{model_name}: response truncated due to MAX_TOKENS")
                _MODEL_COOLDOWNS.pop(model_name, None)
                return text
            except Exception as exc:
                error_str = _sanitize_error_message(str(exc))
                last_error = f"{model_name}: {error_str}"
                if _is_quota_error(exc):
                    # Mark this model as cooled down and skip retrying it immediately —
                    # quota won't recover in the next few seconds, so move on now.
                    cooldown_until = _mark_model_cooldown(model_name, exc)
                    logger.warning(
                        "Gemini quota hit for model %s. Cooling down for %.1fs.",
                        model_name,
                        max(cooldown_until - time.monotonic(), 0.0),
                    )
                    logger.warning(
                        "Gemini request failed — model %s, attempt %s: %s",
                        model_name,
                        attempt + 1,
                        error_str,
                    )
                    break  # ← skip retrying this model; try next immediately
                logger.warning(
                    "Gemini request failed — model %s, attempt %s: %s",
                    model_name,
                    attempt + 1,
                    error_str,
                )
                if attempt < max_retries and _should_retry(error_str):
                    delay_seconds = _retry_delay_seconds(exc, attempt)
                    await asyncio.sleep(delay_seconds)
                else:
                    break

    # -----------------------------------------------------------------------
    # All Gemini models exhausted → try Groq
    # -----------------------------------------------------------------------
    logger.warning(
        "All Gemini models failed (%s). Attempting Groq fallback.", last_error
    )
    try:
        return await _generate_with_groq_fallback(prompt)
    except Exception as groq_exc:
        raise Exception(
            f"All AI providers failed. Gemini error: {last_error} | Groq error: {groq_exc}"
        )


# ---------------------------------------------------------------------------
# JSON repair helper (uses Gemini models only — no Groq needed for repair)
# ---------------------------------------------------------------------------

async def _repair_json_with_model(broken_text: str) -> Dict[str, Any]:
    repair_prompt = f"""The following content was meant to be a single JSON object but may be truncated or malformed.
Repair it into one valid JSON object with the same intended structure.
Do not add markdown fences or commentary. Return only JSON.

BROKEN CONTENT:
{broken_text[:6000]}
"""
    repaired_text = await _generate_with_fallback(
        repair_prompt,
        PREDICTION_MODELS,
        {
            "temperature": 0.1,
            "topP": 0.9,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    )
    return _extract_json_payload(repaired_text)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def predict_careers(prompt: str) -> Dict[str, Any]:
    """
    Calls Gemini for career prediction; falls back to Groq if Gemini quota is hit.
    """
    predicted_text = await _generate_with_fallback(
        prompt,
        PREDICTION_MODELS,
        {
            "temperature": 0.25,
            "topP": 0.9,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    )

    try:
        return _extract_json_payload(predicted_text)
    except Exception as exc:
        logger.error("Failed to decode JSON from AI response: %s", predicted_text[:500])
        try:
            logger.info("Attempting JSON repair pass for prediction response")
            repaired = await _repair_json_with_model(predicted_text)
            if repaired.get("careers"):
                return repaired
        except Exception as repair_exc:
            logger.error("JSON repair pass failed: %s", repair_exc)
        raise Exception("AI returned invalid JSON for prediction.") from exc


async def generate_structured_json(prompt: str) -> Dict[str, Any]:
    generated_text = await _generate_with_fallback(
        prompt,
        PREDICTION_MODELS,
        {
            "temperature": 0.35,
            "topP": 0.9,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    )

    try:
        return _extract_json_payload(generated_text)
    except Exception as exc:
        logger.error("Failed to decode structured JSON response: %s", generated_text[:500])
        raise Exception("AI returned invalid structured JSON.") from exc



# ---------------------------------------------------------------------------
# Chat-specific: complexity classifier
# ---------------------------------------------------------------------------

# Keywords that signal a user is asking for something complex that genuinely
# benefits from Gemini's deeper reasoning and longer context window.
_COMPLEX_CHAT_SIGNALS = [
    # Structured output requests
    "write a", "draft a", "create a", "generate a", "build a",
    "write me", "draft me", "create me",
    # Deep resume / cover-letter work
    "cover letter", "rewrite my resume", "full resume", "complete resume",
    "entire resume", "ats", "optimize my resume",
    # Multi-step planning
    "step by step", "detailed plan", "90 day", "30 day", "roadmap",
    "learning path", "curriculum", "course plan",
    # Analysis that needs long context
    "analyse my resume", "analyze my resume", "review my resume",
    "compare all", "compare the three", "compare all three",
]

def _is_complex_chat_query(message: str) -> bool:
    """
    Returns True if the user's message signals a complex request that should
    be routed to Gemini instead of Groq.
    
    Heuristics (any one match → complex):
      1. Message is long (≥ 180 chars) — likely a detailed request.
      2. Message contains a known complex-task keyword.
    """
    lowered = message.lower()

    # Length heuristic: long messages typically expect detailed output
    if len(message) >= 180:
        return True

    # Keyword heuristic
    if any(signal in lowered for signal in _COMPLEX_CHAT_SIGNALS):
        return True

    return False


# ---------------------------------------------------------------------------
# Public chat API  (Groq-first, Gemini escalation)
# ---------------------------------------------------------------------------

async def generate_chat_reply(prompt: str, user_message: str = "") -> str:
    """
    Smart chat router:
      • Simple queries  (≈80 %) → Groq  (fast, free, no quota pressure)
      • Complex queries (≈20 %) → Gemini (deeper reasoning, longer context)
      • If the primary provider fails  → fall back to the other one.

    Pass `user_message` (the raw user text before the full prompt is built)
    so the classifier can inspect intent without parsing the large prompt string.
    Omitting it falls back to inspecting the tail of `prompt`.
    """
    # Use raw user message for classification when available; otherwise use
    # the last ~300 chars of the assembled prompt as a proxy.
    text_for_classification = user_message.strip() if user_message.strip() else prompt[-300:]
    is_complex = _is_complex_chat_query(text_for_classification)

    if is_complex:
        logger.info("Chat classified as COMPLEX — routing to Gemini first.")
        try:
            return await _generate_with_fallback(
                prompt,
                CHAT_MODELS,
                {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 1024},
            )
        except Exception as gemini_exc:
            logger.warning("Gemini failed for complex chat query (%s); falling back to Groq.", gemini_exc)
            return await _generate_with_groq_fallback(prompt)

    # Simple query — go to Groq directly
    logger.info("Chat classified as SIMPLE — routing to Groq.")
    try:
        return await _generate_with_groq_fallback(prompt)
    except Exception as groq_exc:
        logger.warning("Groq failed for simple chat query (%s); escalating to Gemini.", groq_exc)
        return await _generate_with_fallback(
            prompt,
            CHAT_MODELS,
            {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 1024},
        )
