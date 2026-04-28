"""
ReportLab PDF generation for all 4 resume templates.
"""
import io
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# ── Colour helpers ────────────────────────────────────────────────────────────

def _hex_to_rgb(hex_color: str):
    """Convert #RRGGBB to reportlab Color."""
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return colors.Color(r / 255, g / 255, b / 255)


def _font_size(size_key: str, base: int = 10) -> int:
    return {
        "small": base - 1,
        "medium": base,
        "large": base + 2,
    }.get(size_key, base)


def _spacing(spacing_key: str) -> float:
    return {
        "compact": 0.08 * inch,
        "normal": 0.14 * inch,
        "relaxed": 0.22 * inch,
    }.get(spacing_key, 0.14 * inch)


# ── Content helpers ───────────────────────────────────────────────────────────

def _safe(d: Any, *keys, default="") -> Any:
    for k in keys:
        if not isinstance(d, dict):
            return default
        d = d.get(k, default)
    return d or default


def _bullets(items: List[str], style) -> List[Paragraph]:
    return [Paragraph(f"• {b}", style) for b in items if b.strip()]


# ── Universal Template ────────────────────────────────────────────────────────

def _build_universal(doc_data: Dict[str, Any], theme: Any, fs: int, sp: float) -> List:
    content = doc_data.get("content", {})
    personal = content.get("personal", {})
    styles = getSampleStyleSheet()

    name_style = ParagraphStyle("name", fontSize=fs + 8, fontName="Helvetica-Bold",
                                 textColor=theme, alignment=TA_CENTER, spaceAfter=2)
    contact_style = ParagraphStyle("contact", fontSize=fs - 2, fontName="Helvetica",
                                    alignment=TA_CENTER, textColor=colors.grey, spaceAfter=4)
    section_style = ParagraphStyle("section", fontSize=fs + 1, fontName="Helvetica-Bold",
                                    textColor=theme, spaceBefore=sp * 2, spaceAfter=2)
    body_style = ParagraphStyle("body", fontSize=fs, fontName="Helvetica",
                                 leading=fs + 4, spaceAfter=2)
    sub_style = ParagraphStyle("sub", fontSize=fs, fontName="Helvetica-Bold", spaceAfter=1)

    story = []

    # Header
    story.append(Paragraph(_safe(personal, "name"), name_style))
    contacts = " | ".join(filter(None, [
        _safe(personal, "email"), _safe(personal, "phone"),
        _safe(personal, "location"), _safe(personal, "linkedin"),
    ]))
    story.append(Paragraph(contacts, contact_style))
    story.append(HRFlowable(width="100%", thickness=1, color=theme))

    # Summary
    if content.get("summary"):
        story.append(Paragraph("SUMMARY", section_style))
        story.append(Paragraph(content["summary"], body_style))

    # Experience
    if content.get("experience"):
        story.append(Paragraph("EXPERIENCE", section_style))
        for exp in content["experience"]:
            end = "Present" if exp.get("current") else _safe(exp, "end_date")
            story.append(Paragraph(f"<b>{_safe(exp,'title')}</b> — {_safe(exp,'company')}", sub_style))
            story.append(Paragraph(f"{_safe(exp,'location')}  {_safe(exp,'start_date')} – {end}", body_style))
            story.extend(_bullets(exp.get("bullets", []), body_style))
            story.append(Spacer(1, sp))

    # Education
    if content.get("education"):
        story.append(Paragraph("EDUCATION", section_style))
        for edu in content["education"]:
            story.append(Paragraph(f"<b>{_safe(edu,'degree')} in {_safe(edu,'field')}</b>", sub_style))
            story.append(Paragraph(f"{_safe(edu,'institution')}  {_safe(edu,'start_date')} – {_safe(edu,'end_date')}", body_style))

    # Skills
    if content.get("skills"):
        story.append(Paragraph("SKILLS", section_style))
        skill_text = " • ".join(content["skills"])
        story.append(Paragraph(skill_text, body_style))

    # Projects
    if content.get("projects"):
        story.append(Paragraph("PROJECTS", section_style))
        for proj in content["projects"]:
            story.append(Paragraph(f"<b>{_safe(proj,'name')}</b>  {_safe(proj,'technologies')}", sub_style))
            story.append(Paragraph(_safe(proj, "description"), body_style))
            story.extend(_bullets(proj.get("bullets", []), body_style))
            story.append(Spacer(1, sp))

    return story


# ── Professional Template ─────────────────────────────────────────────────────

def _build_professional(doc_data: Dict[str, Any], theme: Any, fs: int, sp: float) -> List:
    content = doc_data.get("content", {})
    personal = content.get("personal", {})
    styles = getSampleStyleSheet()

    name_style = ParagraphStyle("name_p", fontSize=fs + 10, fontName="Helvetica-Bold",
                                 textColor=colors.white, alignment=TA_LEFT, spaceAfter=2,
                                 leftIndent=0.2 * inch)
    contact_style = ParagraphStyle("contact_p", fontSize=fs - 1, fontName="Helvetica",
                                    textColor=colors.white, spaceAfter=4,
                                    leftIndent=0.2 * inch)
    section_style = ParagraphStyle("section_p", fontSize=fs + 1, fontName="Helvetica-Bold",
                                    textColor=theme, spaceBefore=sp * 2, spaceAfter=4,
                                    borderPad=2)
    body_style = ParagraphStyle("body_p", fontSize=fs, fontName="Helvetica",
                                 leading=fs + 4, spaceAfter=2, leftIndent=0.1 * inch)
    sub_style = ParagraphStyle("sub_p", fontSize=fs, fontName="Helvetica-Bold",
                                leftIndent=0.1 * inch, spaceAfter=1)

    story = []

    # Coloured header block — simulated with a table
    header_data = [[
        Paragraph(_safe(personal, "name"), name_style),
    ]]
    contacts = " | ".join(filter(None, [
        _safe(personal, "email"), _safe(personal, "phone"), _safe(personal, "location")
    ]))
    header_table = Table(
        [[Paragraph(_safe(personal, "name"), name_style)],
         [Paragraph(contacts, contact_style)]],
        colWidths=[7.5 * inch]
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), theme),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, sp))

    def section(title):
        story.append(Paragraph(title, section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=theme))

    if content.get("summary"):
        section("PROFESSIONAL SUMMARY")
        story.append(Paragraph(content["summary"], body_style))

    if content.get("experience"):
        section("WORK EXPERIENCE")
        for exp in content["experience"]:
            end = "Present" if exp.get("current") else _safe(exp, "end_date")
            story.append(Paragraph(f"<b>{_safe(exp,'title')}</b> | {_safe(exp,'company')}", sub_style))
            story.append(Paragraph(f"{_safe(exp,'location')}  ·  {_safe(exp,'start_date')} – {end}", body_style))
            story.extend(_bullets(exp.get("bullets", []), body_style))
            story.append(Spacer(1, sp))

    if content.get("education"):
        section("EDUCATION")
        for edu in content["education"]:
            story.append(Paragraph(f"<b>{_safe(edu,'degree')}, {_safe(edu,'field')}</b>  —  {_safe(edu,'institution')}", sub_style))
            story.append(Paragraph(f"{_safe(edu,'start_date')} – {_safe(edu,'end_date')}", body_style))

    if content.get("skills"):
        section("SKILLS")
        story.append(Paragraph("  |  ".join(content["skills"]), body_style))

    if content.get("projects"):
        section("PROJECTS")
        for proj in content["projects"]:
            story.append(Paragraph(f"<b>{_safe(proj,'name')}</b>", sub_style))
            story.append(Paragraph(_safe(proj, "description"), body_style))
            story.extend(_bullets(proj.get("bullets", []), body_style))
            story.append(Spacer(1, sp))

    return story


# ── Creative Template ─────────────────────────────────────────────────────────
# Uses a two-column sidebar layout

def _build_creative(doc_data: Dict[str, Any], theme: Any, fs: int, sp: float) -> List:
    # Creative template: Full-width blocks with bold typography
    content = doc_data.get("content", {})
    personal = content.get("personal", {})

    light_theme = colors.Color(theme.red, theme.green, theme.blue, alpha=0.1)

    name_style = ParagraphStyle("name_c", fontSize=fs + 14, fontName="Helvetica-Bold",
                                 textColor=theme, spaceAfter=2)
    role_style = ParagraphStyle("role_c", fontSize=fs + 2, fontName="Helvetica",
                                 textColor=colors.HexColor("#555555"), spaceAfter=4)
    section_style = ParagraphStyle("section_c", fontSize=fs + 2, fontName="Helvetica-Bold",
                                    textColor=colors.white, spaceBefore=sp * 2, spaceAfter=4,
                                    leftIndent=4, backColor=theme)
    body_style = ParagraphStyle("body_c", fontSize=fs, fontName="Helvetica",
                                 leading=fs + 4, spaceAfter=2)
    sub_style = ParagraphStyle("sub_c", fontSize=fs, fontName="Helvetica-Bold",
                                textColor=theme, spaceAfter=1)

    story = []
    story.append(Paragraph(_safe(personal, "name"), name_style))
    contacts = "  ·  ".join(filter(None, [
        _safe(personal, "email"), _safe(personal, "phone"),
        _safe(personal, "location"), _safe(personal, "linkedin")
    ]))
    story.append(Paragraph(contacts, role_style))
    story.append(HRFlowable(width="100%", thickness=2, color=theme))

    def section(title):
        story.append(Spacer(1, sp))
        t = Table([[Paragraph(f"  {title}", section_style)]], colWidths=[7.5 * inch])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), theme),
                                ("TOPPADDING", (0, 0), (-1, -1), 4),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(t)

    if content.get("summary"):
        section("ABOUT ME")
        story.append(Paragraph(content["summary"], body_style))

    if content.get("experience"):
        section("EXPERIENCE")
        for exp in content["experience"]:
            end = "Present" if exp.get("current") else _safe(exp, "end_date")
            story.append(Paragraph(f"<b>{_safe(exp,'title')}</b>  •  {_safe(exp,'company')}", sub_style))
            story.append(Paragraph(f"{_safe(exp,'start_date')} – {end}  |  {_safe(exp,'location')}", body_style))
            story.extend(_bullets(exp.get("bullets", []), body_style))
            story.append(Spacer(1, sp * 0.5))

    if content.get("education"):
        section("EDUCATION")
        for edu in content["education"]:
            story.append(Paragraph(f"<b>{_safe(edu,'degree')}, {_safe(edu,'field')}</b>", sub_style))
            story.append(Paragraph(f"{_safe(edu,'institution')}", body_style))

    if content.get("skills"):
        section("SKILLS & TECHNOLOGIES")
        skill_text = "  •  ".join(content["skills"])
        story.append(Paragraph(skill_text, body_style))

    if content.get("projects"):
        section("PROJECTS")
        for proj in content["projects"]:
            story.append(Paragraph(f"<b>{_safe(proj,'name')}</b>  [{_safe(proj,'technologies')}]", sub_style))
            story.append(Paragraph(_safe(proj, "description"), body_style))
            story.extend(_bullets(proj.get("bullets", []), body_style))
            story.append(Spacer(1, sp * 0.5))

    return story


# ── Business Insider Template ─────────────────────────────────────────────────

def _build_business_insider(doc_data: Dict[str, Any], theme: Any, fs: int, sp: float) -> List:
    content = doc_data.get("content", {})
    personal = content.get("personal", {})

    name_style = ParagraphStyle("name_b", fontSize=fs + 12, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#1a1a2e"), spaceAfter=2)
    contact_style = ParagraphStyle("contact_b", fontSize=fs - 1, fontName="Helvetica",
                                    textColor=colors.HexColor("#555555"), spaceAfter=4)
    section_style = ParagraphStyle("section_b", fontSize=fs + 1, fontName="Helvetica-Bold",
                                    textColor=colors.HexColor("#1a1a2e"), spaceBefore=sp * 2,
                                    spaceAfter=2, borderPad=2)
    body_style = ParagraphStyle("body_b", fontSize=fs, fontName="Helvetica",
                                 leading=fs + 5, spaceAfter=2, alignment=TA_JUSTIFY)
    sub_style = ParagraphStyle("sub_b", fontSize=fs, fontName="Helvetica-Bold",
                                textColor=theme, spaceAfter=1)
    date_style = ParagraphStyle("date_b", fontSize=fs - 1, fontName="Helvetica",
                                 textColor=colors.grey, spaceAfter=1)

    story = []

    # Executive header
    header_table = Table(
        [[Paragraph(_safe(personal, "name"), name_style),
          Paragraph("\n".join(filter(None, [
              _safe(personal, "email"), _safe(personal, "phone"),
              _safe(personal, "linkedin")
          ])), contact_style)]],
        colWidths=[4 * inch, 3.5 * inch]
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, 0), 2, theme),
    ]))
    story.append(header_table)
    story.append(Spacer(1, sp))

    def section(title):
        story.append(Paragraph(title, section_style))
        story.append(HRFlowable(width="100%", thickness=1, color=theme, spaceAfter=4))

    if content.get("summary"):
        section("EXECUTIVE SUMMARY")
        story.append(Paragraph(content["summary"], body_style))

    if content.get("experience"):
        section("PROFESSIONAL EXPERIENCE")
        for exp in content["experience"]:
            end = "Present" if exp.get("current") else _safe(exp, "end_date")
            story.append(Paragraph(f"<b>{_safe(exp,'title')}</b>  |  {_safe(exp,'company')}", sub_style))
            story.append(Paragraph(f"{_safe(exp,'start_date')} – {end}  ·  {_safe(exp,'location')}", date_style))
            story.extend(_bullets(exp.get("bullets", []), body_style))
            story.append(Spacer(1, sp))

    if content.get("education"):
        section("EDUCATION")
        for edu in content["education"]:
            story.append(Paragraph(f"<b>{_safe(edu,'degree')}, {_safe(edu,'field')}</b>", sub_style))
            story.append(Paragraph(f"{_safe(edu,'institution')}  |  {_safe(edu,'start_date')} – {_safe(edu,'end_date')}", date_style))

    if content.get("skills"):
        section("CORE COMPETENCIES")
        skill_text = "  ·  ".join(content["skills"])
        story.append(Paragraph(skill_text, body_style))

    if content.get("projects"):
        section("KEY ACHIEVEMENTS & PROJECTS")
        for proj in content["projects"]:
            story.append(Paragraph(f"<b>{_safe(proj,'name')}</b>", sub_style))
            story.append(Paragraph(_safe(proj, "description"), body_style))
            story.append(Spacer(1, sp * 0.5))

    return story


# ── Public render function ────────────────────────────────────────────────────

TEMPLATE_BUILDERS = {
    "universal": _build_universal,
    "professional": _build_professional,
    "creative": _build_creative,
    "business_insider": _build_business_insider,
}


def render_pdf(doc_data: Dict[str, Any]) -> bytes:
    """Render a resume as PDF bytes using the selected template."""
    template_name = doc_data.get("template_name", "universal").lower().replace(" ", "_")
    builder = TEMPLATE_BUILDERS.get(template_name, _build_universal)

    theme_hex = doc_data.get("theme_color", "#6366f1")
    theme_color = _hex_to_rgb(theme_hex)
    font_size = _font_size(doc_data.get("font_size", "medium"))
    spacing = _spacing(doc_data.get("spacing", "normal"))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    story = builder(doc_data, theme_color, font_size, spacing)
    doc.build(story)
    return buf.getvalue()
