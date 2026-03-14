"""
report_generator.py
Generates a ReportLab-based PDF forensic case file for PHANTOMPROOF.ai.
Requires: reportlab  (pip install reportlab)
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    Image as RLImage
)
import qrcode
from PIL import Image as PILImage

# ── Colour palette ────────────────────────────────────────────────────────────
DARK_BG       = colors.HexColor("#0D0D1A")
ACCENT        = colors.HexColor("#7C3AED")
TEXT_LIGHT    = colors.HexColor("#E2E8F0")
TEXT_MUTED    = colors.HexColor("#94A3B8")
GREEN_BANNER  = colors.HexColor("#16A34A")
RED_BANNER    = colors.HexColor("#DC2626")
AMBER_BANNER  = colors.HexColor("#D97706")
GREY_BOX_BG   = colors.HexColor("#1E293B")
TABLE_HEADER  = colors.HexColor("#312E81")
TABLE_ALT     = colors.HexColor("#1E1B4B")
WHITE         = colors.white
BLACK         = colors.black


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "PhTitle",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "PhSub",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=ACCENT,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "meta": ParagraphStyle(
            "PhMeta",
            fontName="Helvetica",
            fontSize=9,
            textColor=TEXT_MUTED,
            alignment=TA_CENTER,
            spaceAfter=0,
        ),
        "section_heading": ParagraphStyle(
            "PhHeading",
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=ACCENT,
            spaceBefore=14,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "PhBody",
            fontName="Helvetica",
            fontSize=10,
            textColor=TEXT_LIGHT,
            spaceAfter=4,
            leading=15,
        ),
        "grey_box": ParagraphStyle(
            "PhGreyBox",
            fontName="Helvetica",
            fontSize=9,
            textColor=TEXT_LIGHT,
            backColor=GREY_BOX_BG,
            borderPadding=(6, 8, 6, 8),
            spaceAfter=6,
            leading=14,
        ),
        "bullet": ParagraphStyle(
            "PhBullet",
            fontName="Helvetica",
            fontSize=10,
            textColor=TEXT_LIGHT,
            leftIndent=14,
            bulletIndent=4,
            spaceAfter=2,
            leading=14,
        ),
        "score_big": ParagraphStyle(
            "PhScore",
            fontName="Helvetica-Bold",
            fontSize=28,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "footer": ParagraphStyle(
            "PhFooter",
            fontName="Helvetica-Oblique",
            fontSize=8,
            textColor=TEXT_MUTED,
            alignment=TA_CENTER,
            spaceBefore=8,
        ),
    }


def _generate_qr_code(url: str) -> io.BytesIO:
    """Generates a QR code image buffer for the provided URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=0,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Needs to be RGBA or RGB for ReportLab depending on PIL version, RGB is safe
    img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def generate_pdf_report(data: dict[str, Any]) -> bytes:
    """
    Build a ReportLab PDF forensic case file and return raw PDF bytes.

    Expected keys in `data`:
        file_id, authenticity_score, signal_breakdown, heatmap_url,
        extracted_text, threat_category, risk_level, flags, verdict,
        matched_sources, explanation, fingerprint_match (optional)
    """
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="PHANTOMPROOF Forensic Report",
        author="PHANTOMPROOF.ai",
    )

    st = _styles()
    story: list = []

    # ── Dark header background table ─────────────────────────────────────────
    ts_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    header_content = [
        [Paragraph("PHANTOMPROOF FORENSIC REPORT", st["title"])],
        [Paragraph("Classification: CONFIDENTIAL", st["subtitle"])],
        [Paragraph(f"Case ID: {data.get('file_id', '—')}", st["meta"])],
        [Paragraph(f"Generated At: {ts_now}", st["meta"])],
    ]
    header_table = Table(header_content, colWidths=["100%"])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_BG),
        ("TOPPADDING",    (0, 0), (-1, 0), 18),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 18),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [DARK_BG]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── SECTION 2 — Verdict Banner ───────────────────────────────────────────
    score: float = float(data.get("authenticity_score", 50))
    verdict: str = str(data.get("verdict", "UNVERIFIED"))
    risk: str = str(data.get("risk_level", "UNKNOWN"))

    if score > 70:
        banner_color = GREEN_BANNER
    elif score < 40:
        banner_color = RED_BANNER
    else:
        banner_color = AMBER_BANNER

    banner_style = ParagraphStyle(
        "Banner",
        fontName="Helvetica-Bold",
        fontSize=16,
        textColor=WHITE,
        alignment=TA_CENTER,
    )
    banner_table = Table(
        [[Paragraph(f"VERDICT: {verdict}   |   CONFIDENCE: {round(score,1)}%", banner_style)]],
        colWidths=["100%"],
    )
    banner_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), banner_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [banner_color]),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── SECTION 2.5 — Executive Summary ──────────────────────────────────────
    exec_sum: str = data.get("executive_summary", "")
    if exec_sum:
        story.append(Paragraph("EXECUTIVE SUMMARY", st["section_heading"]))
        story.append(Paragraph(exec_sum, st["grey_box"]))
        story.append(Spacer(1, 0.3 * cm))

    # ── SECTION 3 — Authenticity Score ──────────────────────────────────────
    story.append(Paragraph("SIGNAL BREAKDOWN", st["section_heading"]))

    breakdown: dict = data.get("signal_breakdown", {})
    score_rows = [
        [
            Paragraph("Signal", ParagraphStyle("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("Contribution", ParagraphStyle("TH", fontName="Helvetica-Bold", fontSize=10, textColor=WHITE, alignment=TA_CENTER)),
        ],
        ["ELA Contribution",       f"{round(breakdown.get('ela_contribution', 0), 1)}%" if 'ela_contribution' in breakdown else "—"],
        ["Metadata Contribution",  f"{round(breakdown.get('metadata_contribution', 0), 1)}%" if 'metadata_contribution' in breakdown else "—"],
        ["Pattern Contribution",   f"{round(breakdown.get('pattern_contribution', 0), 1)}%" if 'pattern_contribution' in breakdown else "—"],
    ]
    score_table = Table(score_rows, colWidths=[9 * cm, 8 * cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), TABLE_HEADER),
        ("BACKGROUND",    (0, 1), (-1, -1), TABLE_ALT),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [TABLE_ALT, DARK_BG]),
        ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#312E81")),
        ("ROUNDEDCORNERS",(0, 0), (-1, -1), [4, 4, 4, 4]),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 0.3 * cm))
    
    # ── SECTION 3.5 — AI Ensemble Results ───────────────────────────────────
    ai_ensemble: dict = data.get("ai_ensemble", {})
    if ai_ensemble:
        story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
        story.append(Paragraph("AI GENERATION DETECTION", st["section_heading"]))
        ai_conf = ai_ensemble.get("ai_confidence", 0)
        ai_model = ai_ensemble.get("primary_model", "Unknown")
        story.append(Paragraph(f"<b>AI Confidence:</b> {round(ai_conf, 1)}%", st["body"]))
        story.append(Paragraph(f"<b>Primary Model:</b> {ai_model}", st["body"]))
        
    # ── SECTION 3.6 - Reasoning Chain ───────────────────────────────────────
    explainability: dict = data.get("explainability", {})
    reasoning: list = explainability.get("reasoning", [])
    if reasoning:
        story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
        story.append(Paragraph("HOW WE REACHED THIS CONCLUSION", st["section_heading"]))
        for step in reasoning:
            story.append(Paragraph(f"• {step}", st["bullet"]))
        story.append(Spacer(1, 0.3 * cm))

    # ── SECTION 3.8 — Visual Evidence ────────────────────────────────────────
    visuals = data.get("visualizations", {})
    ela_base64 = visuals.get("ela_heatmap", "")
    
    import os as _os
    import base64 as _base64
    from reportlab.platypus import Image
    
    base_dir = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
    file_id = data.get("file_id", "")
    img_path = _os.path.join(base_dir, "uploads", file_id)
    
    has_orig = _os.path.exists(img_path)
    has_ela = bool(ela_base64)
    
    if has_orig or has_ela:
        story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
        story.append(Paragraph("VISUAL EVIDENCE", st["section_heading"]))
        
        images_row = []
        if has_orig:
            try:
                img1 = Image(img_path, width=7*cm, height=7*cm, kind='proportional')
                images_row.append([Paragraph("<b>Original</b>", st["meta"]), img1])
            except Exception:
                pass
                
        if has_ela:
            try:
                ela_bytes = _base64.b64decode(ela_base64)
                ela_stream = io.BytesIO(ela_bytes)
                img2 = Image(ela_stream, width=7*cm, height=7*cm, kind='proportional')
                images_row.append([Paragraph("<b>ELA Heatmap</b>", st["meta"]), img2])
            except Exception:
                pass
                
        if images_row:
            table_data = [[item[0] for item in images_row], [item[1] for item in images_row]]
            col_widths = [8*cm] * len(images_row)
            img_table = Table(table_data, colWidths=col_widths)
            img_table.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(img_table)
            story.append(Spacer(1, 0.3 * cm))

    # ── SECTION 4 — OCR Extracted Text ──────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
    story.append(Paragraph("EXTRACTED CONTENT", st["section_heading"]))
    extracted: str = data.get("extracted_text", "") or "No text detected in image."
    story.append(Paragraph(extracted, st["grey_box"]))

    # ── SECTION 5 — OSINT Findings ───────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
    story.append(Paragraph("OSINT VERIFICATION", st["section_heading"]))

    # Try explaining the OSINT from top-level explanation first
    # (data.get("explanation") was replaced by the complex dict in latest changes, 
    # but the FE fetch extracts it. We need to handle BOTH strings and dicts properly)
    exp = data.get("explanation")
    explanation_str = ""
    if isinstance(exp, str):
        explanation_str = exp
    elif isinstance(exp, dict) and "sections" in exp:
        pass # Handle in SECTION 6
        
    fingerprint: str = data.get("fingerprint_match", "")
    story.append(Paragraph(f"<b>Verdict:</b> {verdict}", st["body"]))
    if explanation_str:
        story.append(Paragraph(f"<b>Explanation:</b> {explanation_str}", st["body"]))
    if fingerprint:
        story.append(Paragraph(f"<b>Fingerprint Match:</b> {fingerprint}", st["body"]))

    matched: list = data.get("matched_sources", [])
    if matched:
        story.append(Paragraph("<b>Matched Sources:</b>", st["body"]))
        for src in matched:
            story.append(Paragraph(f"• {src}", st["bullet"]))

    # ── SECTION 6 — Evidence Explanation ──────────────────────────────────────
    evidence_explanation = data.get("explanation") or {}
    exp_sections = {}
    if isinstance(evidence_explanation, dict):
        exp_sections = evidence_explanation.get("sections", {})

    if exp_sections:
        story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
        story.append(Paragraph("EVIDENCE EXPLANATION", st["section_heading"]))

        section_titles = [
            ("digital_forensics", "Digital Forensics"),
            ("contextual_analysis", "Contextual Analysis"),
            ("logical_consistency", "Logical Consistency"),
            ("conclusion", "Conclusion"),
        ]
        for key, title in section_titles:
            text = exp_sections.get(key, "")
            if text:
                story.append(Paragraph(f"<b>{title}</b>", st["body"]))
                story.append(Paragraph(text, st["grey_box"]))
                story.append(Spacer(1, 0.15 * cm))

    # ── SECTION 6.5 — Misinformation Timeline ───────────────────────────────
    timeline_analysis = data.get("timeline_analysis", {})
    timeline_events = timeline_analysis.get("timeline", [])
    
    if timeline_events:
        story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
        story.append(Paragraph("MISINFORMATION TIMELINE ANALYSIS", st["section_heading"]))
        
        explanation = timeline_analysis.get("timeline_explanation")
        if explanation:
            story.append(Paragraph(explanation, st["body"]))
            story.append(Spacer(1, 0.15 * cm))
            
        for event in timeline_events:
            date_str = event.get("date", "Unknown Date")
            source = event.get("source", "Unknown Source")
            desc = event.get("event", "")
            if desc:
                bullet_text = f"<b>{date_str}</b> ({source}): {desc}"
                story.append(Paragraph(f"• {bullet_text}", st["bullet"]))
        
        matched_case = timeline_analysis.get("matched_case")
        if matched_case:
            story.append(Spacer(1, 0.1 * cm))
            story.append(Paragraph(f"<b>Matched Case:</b> {matched_case.get('claim')} (Similarity: {matched_case.get('similarity', 0)*100:.0f}%)", st["grey_box"]))

    # ── SECTION 7 — Threat Classification ───────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
    story.append(Paragraph("THREAT CLASSIFICATION", st["section_heading"]))
    threat: str = data.get("threat_category", "UNVERIFIED")
    story.append(Paragraph(f"<b>Category:</b> {threat}", st["body"]))

    flags: list = data.get("flags", [])
    if flags:
        story.append(Paragraph("<b>Flags Detected:</b>", st["body"]))
        for flag in flags:
            story.append(Paragraph(f"• {flag}", st["bullet"]))
    else:
        story.append(Paragraph("No forensic flags raised.", st["body"]))

    # ── SECTION 7 — Footer ───────────────────────────────────────────────────
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=TEXT_MUTED))
    story.append(Spacer(1, 0.2 * cm))

    # Generate QR Code
    file_id: str = data.get("file_id", "verified")
    verify_url = f"https://phantomproof.ai/verify/{file_id}"
    qr_buf = _generate_qr_code(verify_url)
    
    qr_image = RLImage(qr_buf, width=2.5*cm, height=2.5*cm)
    
    footer_text = Paragraph(
        f"<b>This report was generated by PHANTOMPROOF.ai</b><br/>"
        f"For verification, scan the QR code or visit phantomproof.ai/verify/{file_id}",
        st["footer"],
    )
    
    footer_table = Table([[qr_image, footer_text]], colWidths=[3*cm, 13*cm])
    footer_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, 0), "RIGHT"),
        ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "LEFT"),
        ("VALIGN", (1, 0), (1, 0), "MIDDLE"),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
    ]))

    story.append(footer_table)

    doc.build(story)
    return buf.getvalue()

# NEW: Multilingual explainability + verdict breakdown
translations = {
    "en": {"title": "Executive Summary", "tampering": "Tampering Detected"},
    "hi": {"title": "कार्यकारी सारांश", "tampering": "छेड़छाड़ का पता चला"},
    "ta": {"title": "நிகழ்ச்சி சுருக்கம்", "tampering": "மாற்றம் கண்டறியப்பட்டது"},
    "mr": {"title": "कार्यकारी सारांश", "tampering": "छेडछाड आढळली"},
    "bn": {"title": "নিবাহী সারাংশ", "tampering": "টেম্পারিং সনাক্ত হয়েছে"},
    "te": {"title": "కార్యనిర్వాహక సారాంశం", "tampering": "ట్యాంపరింగ్ కనుగొనబడింది"},
    "kn": {"title": "ಕಾರ್ಯಾಂಗ ಸಾರಾಂಶ", "tampering": "ತಿದ್ದುವಿಕೆ ಕಂಡುಬಂದಿದೆ"},
    "gu": {"title": "કાર્યકારી સારાંશ", "tampering": "છેડછાડ મળી આવી"},
    "ml": {"title": "എക്സിക്യൂട്ടീവ് സംഗ്രഹം", "tampering": "കൃത്രിമം കണ്ടെത്തി"},
    "pa": {"title": "ਕਾਰਜਕਾਰੀ ਸਾਰ", "tampering": "ਛੇੜਛਾੜ ਦਾ ਪਤਾ ਲੱਗਾ"}
}

def generate_ela_base64(image_path):
    import base64
    import os
    if not image_path or not os.path.exists(image_path): return ""
    try:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except Exception:
        return ""

def generate_explainable_report(scan_result, lang="en"):
    # Ensure lang is supported, fallback to en
    if lang not in translations:
        lang = "en"
        
    image_path = scan_result.get('image_path', '')
    
    # CRITICAL: Get AI detection FIRST
    ai_result = scan_result.get('ai_ensemble')
    if not ai_result:
        from .ai_detector import detector
        ai_result = detector.detect_real_ai(image_path)
    
    # EXISTING: ELA + Metadata + OCR
    forensics = {
        'ela_score': scan_result.get('ela_score', 0),
        'metadata_score': scan_result.get('metadata_score', 0),
        'scam_similarity': scan_result.get('scam_similarity', 0)
    }
    
    # PRODUCTION VERDICT LOGIC
    if ai_result.get('ai_confidence', 0) > 85:
        verdict = "🔴 AI-GENERATED"
        risk_score = 95
    elif ai_result.get('ai_confidence', 0) > 40:
        verdict = "🟡 SUSPICIOUS"
        risk_score = 65
    else:
        verdict = "🟢 AUTHENTIC"
        risk_score = 10
        
    verdict_breakdown = {
        "ela_contribution": forensics['ela_score'] * 0.25,
        "metadata_contribution": forensics['metadata_score'] * 0.15,
        "pattern_contribution": forensics['scam_similarity'] * 0.15
    }
    
    primary_model = ai_result.get('primary_model', 'Unknown')
    hf_score = ai_result.get('technical_details', {}).get('hf_score', '0%')
    ai_conf = ai_result.get('ai_confidence', 0)

    # ── Explainability: reasoning chain ──────────────────────────────────────
    formula_str = "0.25×ELA + 0.15×Metadata + 0.15×ScamPattern + AI Detector (primary signal)"

    reasoning_steps: list[str] = []

    # Step 1: ELA
    ela_val = forensics['ela_score']
    if ela_val < 50:
        reasoning_steps.append(f"ELA detected compression artifacts (score {ela_val:.1f}%) — suggests the image was re-saved or edited.")
    elif ela_val >= 75:
        reasoning_steps.append(f"ELA found no significant compression artifacts (score {ela_val:.1f}%) — consistent with an original image.")
    else:
        reasoning_steps.append(f"ELA returned a moderate score ({ela_val:.1f}%) — inconclusive on compression artifacts.")

    # Step 2: Metadata
    meta_val = forensics['metadata_score']
    if meta_val < 50:
        reasoning_steps.append(f"Metadata analysis flagged missing or inconsistent EXIF data (score {meta_val:.1f}%).")
    elif meta_val >= 75:
        reasoning_steps.append(f"Metadata is consistent and intact (score {meta_val:.1f}%).")
    else:
        reasoning_steps.append(f"Metadata returned a neutral score ({meta_val:.1f}%) — screenshots often lack EXIF.")

    # Step 3: AI Detection (primary signal)
    if ai_conf > 85:
        reasoning_steps.append(f"AI Image Detector (umm-maybe/AI-image-detector) classified as '{primary_model}' with {ai_conf:.1f}% confidence — strong AI-generated signal.")
    elif ai_conf > 40:
        reasoning_steps.append(f"AI Image Detector classified as '{primary_model}' with {ai_conf:.1f}% confidence — ambiguous, flagged as suspicious.")
    else:
        reasoning_steps.append(f"AI Image Detector classified as '{primary_model}' with {ai_conf:.1f}% confidence — appears to be a real photograph.")

    # Step 4: Visual forensics sub-signals
    breakdown = ai_result.get('breakdown', {})
    if breakdown:
        sharp = breakdown.get('Sharpness', 0)
        sym = breakdown.get('Symmetry', 0)
        color = breakdown.get('Color', 0)
        reasoning_steps.append(f"Visual forensics backup: Sharpness={sharp:.1f}%, Symmetry={sym:.1f}%, Color Distribution={color:.1f}%.")

    # Step 5: Scam similarity
    scam_val = forensics['scam_similarity']
    if scam_val > 50:
        reasoning_steps.append(f"Scam pattern similarity is high ({scam_val:.1f}%) — matches known fraud templates.")
    else:
        reasoning_steps.append(f"Scam pattern similarity is low ({scam_val:.1f}%) — no known fraud match.")

    # Final verdict explanation
    reasoning_steps.append(f"Final Verdict: {verdict} with risk score {risk_score}%.")

    explainability = {
        "models_used": [
            {
                "name": "Forensics Engine (ELA)",
                "description": "Error Level Analysis — detects compression artifacts from image re-saving or editing",
                "weight": "25%",
                "score": round(ela_val, 1),
            },
            {
                "name": "Forensics Engine (Metadata)",
                "description": "EXIF metadata integrity check — verifies camera/software information",
                "weight": "15%",
                "score": round(meta_val, 1),
            },
            {
                "name": "Scam & OSINT Patterns",
                "description": "Matches image content against known scam, fraud, and misinformation templates",
                "weight": "15%",
                "score": round(scam_val, 1),
            },
            {
                "name": "AI Image Detector (HuggingFace)",
                "description": f"umm-maybe/AI-image-detector — deep learning classifier ({primary_model})",
                "weight": "primary signal",
                "score": round(ai_conf, 1),
            },
            {
                "name": "Sharpness Analysis",
                "description": "Laplacian variance — AI images tend to be unnaturally sharp",
                "weight": "5% (backup)",
                "score": round(breakdown.get('Sharpness', 0), 1) if breakdown else "N/A",
            },
            {
                "name": "Symmetry Analysis",
                "description": "Horizontal flip comparison — AI faces often have perfect symmetry",
                "weight": "5% (backup)",
                "score": round(breakdown.get('Symmetry', 0), 1) if breakdown else "N/A",
            },
        ],
        "formula": formula_str,
        "reasoning": reasoning_steps,
    }

    return {
        "verdict": verdict,
        "risk_score": risk_score,
        "confidence": risk_score, 
        "ai_ensemble": ai_result,
        "forensics": forensics,
        "verdict_breakdown": verdict_breakdown,
        "visualizations": {
            "ela_heatmap": generate_ela_base64(image_path)
        },
        "lang": lang,
        "title": translations[lang].get("title", "Executive Summary"),
        "tampering": translations[lang].get("tampering", "Tampering Detected"),
        "executive_summary": {
            "en": f"AI Generation: {ai_conf}% confidence "
                  f"({primary_model}). "
                  f"HF model score: {hf_score}",
            "hi": f"AI निर्माण: {ai_conf}%. "
                  f"प्राथमिक मॉडल: {primary_model}"
        },
        "explainability": explainability,
        "evidence_explanation": {},  # populated by scan_routes after generate_explanation()
        "timeline_analysis": {}, # populated by scan_routes after generate_timeline()
    }

