"""
Notification service — WhatsApp (Twilio) + Email (SMTP).
Fires after each successful application batch.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)


def _user_display_name(user) -> str:
    display_name = getattr(user, "name", None)
    if display_name:
        return display_name

    email = getattr(user, "email", "") or ""
    if "@" in email:
        return email.split("@", 1)[0]

    return "there"


# ── WhatsApp via Twilio ────────────────────────────────────────────────────────

def send_whatsapp(to_number: str, message: str) -> bool:
    """Send WhatsApp message via Twilio. Returns True on success."""
    try:
        from twilio.rest import Client
        client = Client(
            os.environ["TWILIO_ACCOUNT_SID"],
            os.environ["TWILIO_AUTH_TOKEN"],
        )
        msg = client.messages.create(
            body  = message,
            from_ = f"whatsapp:{os.environ.get('TWILIO_WA_FROM', '+14155238886')}",
            to    = f"whatsapp:{to_number}",
        )
        logger.info(f"[WhatsApp] Sent SID={msg.sid} to {to_number}")
        return True
    except Exception as e:
        logger.error(f"[WhatsApp] Failed: {e}")
        return False


# ── Email via SMTP ─────────────────────────────────────────────────────────────

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send email notification via SMTP (configure via env vars)."""
    try:
        smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ["SMTP_USER"]
        smtp_pass = os.environ["SMTP_PASS"]

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        logger.info(f"[Email] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"[Email] Failed: {e}")
        return False


# ── Notification builder ───────────────────────────────────────────────────────

def _build_whatsapp_message(user_name: str, applied_jobs: list[dict]) -> str:
    date_str = datetime.now().strftime("%d %b %Y")
    lines = [f"*Career AI — Daily Apply Report* ({date_str})", f"Hi {user_name}!\n"]
    for i, job in enumerate(applied_jobs[:10], 1):
        lines.append(
            f"{i}. *{job['job_title']}* @ {job['company']}\n"
            f"   Score: {job['score']}/100 | {job['job']}"
        )
    lines.append(f"\nTotal applied today: *{len(applied_jobs)}*")
    lines.append("Login to Career AI to view cover letters and track responses.")
    return "\n".join(lines)


def _build_email_html(user_name: str, applied_jobs: list[dict]) -> str:
    date_str = datetime.now().strftime("%d %B %Y")
    rows = ""
    for job in applied_jobs[:20]:
        score_color = "#16a34a" if job["score"] >= 80 else "#d97706" if job["score"] >= 60 else "#dc2626"
        rows += f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
            <strong>{job['job_title']}</strong><br>
            <span style="color:#6b7280;font-size:13px">{job['company']}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">
            {job.get('company','')}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
            <span style="background:{score_color}20;color:{score_color};padding:2px 10px;
                         border-radius:12px;font-size:13px;font-weight:600">
              {job['score']}
            </span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
            <a href="{job['job']}" style="color:#2563eb;font-size:13px">View job</a>
          </td>
        </tr>"""

    return f"""
    <html><body style="font-family:-apple-system,sans-serif;color:#111;max-width:640px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 4px">Career AI applied to {len(applied_jobs)} jobs for you</h2>
      <p style="color:#6b7280;margin:0 0 24px">{date_str}</p>
      <p>Hi {user_name}, here's what your agent did today:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f9fafb;font-size:12px;text-transform:uppercase;color:#9ca3af">
            <th style="padding:8px 12px;text-align:left">Role</th>
            <th style="padding:8px 12px;text-align:left">Company</th>
            <th style="padding:8px 12px;text-align:center">Match</th>
            <th style="padding:8px 12px;text-align:left">Link</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:13px">
        Log in to Career AI to view your full cover letters, track responses, and manage settings.
      </p>
    </body></html>"""


async def send_application_notification(user, applied_jobs: list[dict]):
    """Send both WhatsApp and email notifications after a batch apply."""
    if not applied_jobs:
        return

    user_name = _user_display_name(user)

    # WhatsApp
    if user.phone:
        msg = _build_whatsapp_message(user_name, applied_jobs)
        send_whatsapp(user.phone, msg)

    # Email
    if user.email:
        html = _build_email_html(user_name, applied_jobs)
        send_email(
            to_email  = user.email,
            subject   = f"Career AI applied to {len(applied_jobs)} jobs for you today",
            html_body = html,
        )
