"""
explanation_engine.py
Generates structured, natural-language forensic explanations for PHANTOMPROOF.ai.

Pure Python — no ML dependencies.  Every sentence is dynamically derived from
actual analysis scores; no generic filler text is used.
"""

from __future__ import annotations

from typing import Any


def generate_explanation(analysis_results: dict[str, Any]) -> dict[str, Any]:
    """
    Build a structured forensic explanation from analysis signals.

    Parameters
    ----------
    analysis_results : dict
        Expected keys (all optional — engine degrades gracefully):
            ela_score          – float 0-100
            metadata_score     – float 0-100
            clip_analysis      – dict from clip_engine.classify_image()
            ocr_text           – str
            osint_matches      – list[str]
            osint_verdict      – str  (TRUE / FALSE / SCAM / UNVERIFIED)
            authenticity_score – float 0-100

    Returns
    -------
    dict with keys:
        full_text  – str   concatenated explanation
        sections   – dict  {digital_forensics, contextual_analysis,
                            logical_consistency, conclusion}
    """
    ela = analysis_results.get("ela_score", 50.0)
    meta = analysis_results.get("metadata_score", 50.0)
    clip = analysis_results.get("clip_analysis") or {}
    ocr_text = (analysis_results.get("ocr_text") or "").strip()
    osint_matches = analysis_results.get("osint_matches") or []
    osint_verdict = (analysis_results.get("osint_verdict") or "UNVERIFIED").upper()
    auth_score = analysis_results.get("authenticity_score", 50.0)

    # ── 1. Digital Forensics ──────────────────────────────────────────────────
    df_parts: list[str] = []

    # ELA
    if ela < 35:
        df_parts.append(
            f"Error Level Analysis returned a score of {ela:.1f}%, indicating "
            "significant compression artifacts. This is a strong indicator that "
            "the image has been re-saved or digitally edited after its original capture."
        )
    elif ela < 55:
        df_parts.append(
            f"Error Level Analysis returned a moderate score of {ela:.1f}%. "
            "Some compression inconsistencies are present, which may suggest "
            "minor editing or format conversion, though this alone is not conclusive."
        )
    else:
        df_parts.append(
            f"Error Level Analysis returned a score of {ela:.1f}%, showing "
            "compression levels consistent with an unmodified original image. "
            "No significant editing artifacts were detected at this layer."
        )

    # Metadata
    if meta < 35:
        df_parts.append(
            f"Metadata integrity scored {meta:.1f}%. Critical EXIF fields are "
            "missing or inconsistent, which substantially reduces trust in the "
            "image's provenance. This pattern is often associated with images "
            "processed through editing software or stripped of their origin data."
        )
    elif meta < 55:
        df_parts.append(
            f"Metadata integrity scored {meta:.1f}%. Some EXIF information is "
            "present but incomplete — this is common in screenshots or images "
            "downloaded from social media, which routinely strip metadata."
        )
    else:
        df_parts.append(
            f"Metadata integrity scored {meta:.1f}%, indicating the EXIF data "
            "is largely intact and consistent with the expected camera or device "
            "information. This supports the image's claimed origin."
        )

    digital_forensics = " ".join(df_parts)

    # ── 2. Contextual Analysis ────────────────────────────────────────────────
    ca_parts: list[str] = []

    if ocr_text:
        ca_parts.append(
            f"Optical character recognition extracted the following textual content "
            f"from the image: \"{ocr_text[:200]}{'…' if len(ocr_text) > 200 else ''}\"."
        )
    else:
        ca_parts.append(
            "No readable text was extracted from this image via OCR, so "
            "text-based claim verification could not be performed."
        )

    if osint_verdict == "TRUE":
        ca_parts.append(
            "Open-source intelligence (OSINT) verification confirmed the claim "
            "as TRUE. The extracted text was corroborated by trusted fact-checking "
            f"sources ({', '.join(osint_matches) if osint_matches else 'multiple sources'})."
        )
    elif osint_verdict == "FALSE":
        ca_parts.append(
            "OSINT verification flagged the claim as FALSE. The extracted content "
            "contradicts information from trusted fact-checking databases "
            f"({', '.join(osint_matches) if osint_matches else 'known sources'}). "
            "This is a significant credibility concern."
        )
    elif osint_verdict == "SCAM":
        ca_parts.append(
            "OSINT verification identified the content as matching a known SCAM "
            f"pattern ({', '.join(osint_matches) if osint_matches else 'fraud databases'}). "
            "The image appears designed to deceive or defraud viewers."
        )
    else:
        if ocr_text:
            ca_parts.append(
                "The extracted text could not be verified against any known "
                "fact-checking sources. The claim remains UNVERIFIED — this does "
                "not confirm or deny its accuracy, but no corroborating evidence "
                "was found."
            )
        else:
            ca_parts.append(
                "Without extractable text, contextual verification against OSINT "
                "databases was not applicable for this image."
            )

    contextual_analysis = " ".join(ca_parts)

    # ── 3. Logical Consistency ────────────────────────────────────────────────
    lc_parts: list[str] = []

    clip_label = clip.get("label", "unknown")
    clip_conf = clip.get("confidence", 0.0)
    clip_flags = clip.get("semantic_flags", [])

    if clip_label != "unknown" and clip_conf > 0:
        label_display = clip_label.replace("_", " ")
        lc_parts.append(
            f"CLIP semantic classification identified this image as "
            f"\"{label_display}\" with {clip_conf * 100:.1f}% confidence."
        )

        # Semantic flag descriptions
        if clip_flags:
            lc_parts.append(
                "Semantic observations: " + "; ".join(clip_flags) + "."
            )

        # Cross-check: does the CLIP label conflict with authenticity?
        suspicious_labels = {
            "edited_meme", "manipulated_graphic", "ai_generated_image",
            "digital_poster",
        }
        authentic_labels = {"authentic_photograph"}

        if clip_label in suspicious_labels and auth_score > 65:
            lc_parts.append(
                "There is a semantic inconsistency: the image is classified as "
                f"\"{label_display}\" by CLIP, yet the forensic authenticity "
                f"score is relatively high ({auth_score:.1f}%). This mixed signal "
                "warrants closer manual inspection."
            )
        elif clip_label in authentic_labels and auth_score < 40:
            lc_parts.append(
                "A notable inconsistency exists: CLIP classifies this as an "
                "authentic photograph, yet the forensic authenticity score is "
                f"low ({auth_score:.1f}%). The image may have been re-processed "
                "after original capture."
            )
        elif clip_label in suspicious_labels and auth_score < 40:
            lc_parts.append(
                "Both semantic classification and forensic analysis converge on "
                "a concern: the image's visual style and technical properties "
                "suggest it has been manipulated or is not an original photograph."
            )
        elif clip_label in authentic_labels and auth_score > 65:
            lc_parts.append(
                "Semantic classification and forensic analysis are consistent — "
                "both indicate the image is likely an authentic, unmodified photograph."
            )
        else:
            lc_parts.append(
                "The semantic classification does not strongly conflict with or "
                "confirm the forensic analysis. The evidence is mixed and should "
                "be interpreted in context."
            )
    else:
        lc_parts.append(
            "CLIP semantic classification was not available for this image. "
            "Logical consistency cannot be assessed against visual semantics, "
            "but the forensic and contextual analyses above remain valid."
        )

    logical_consistency = " ".join(lc_parts)

    # ── 4. Conclusion ─────────────────────────────────────────────────────────
    conclusion_parts: list[str] = []

    if auth_score >= 70 and osint_verdict in ("TRUE", "UNVERIFIED"):
        conclusion_parts.append(
            f"Based on the combined forensic evidence (authenticity score: "
            f"{auth_score:.1f}%), the image does not exhibit strong indicators "
            "of manipulation. The digital forensics signals are within normal "
            "parameters for an original capture."
        )
    elif auth_score < 40 or osint_verdict in ("FALSE", "SCAM"):
        conclusion_parts.append(
            f"The forensic evidence raises significant concerns about this image's "
            f"integrity (authenticity score: {auth_score:.1f}%). "
        )
        if osint_verdict in ("FALSE", "SCAM"):
            conclusion_parts.append(
                f"Furthermore, OSINT verification classified the associated claim "
                f"as {osint_verdict}, which compounds the credibility deficit. "
            )
        conclusion_parts.append(
            "This image should be treated with caution and may warrant further "
            "investigation before being considered trustworthy."
        )
    else:
        conclusion_parts.append(
            f"The analysis yields mixed results (authenticity score: "
            f"{auth_score:.1f}%). Some forensic indicators are within normal "
            "ranges while others show potential irregularities. The evidence "
            "is inconclusive, and manual review is recommended before drawing "
            "definitive conclusions about the image's authenticity."
        )

    conclusion = " ".join(conclusion_parts)

    # ── Assemble ──────────────────────────────────────────────────────────────
    sections = {
        "digital_forensics": digital_forensics,
        "contextual_analysis": contextual_analysis,
        "logical_consistency": logical_consistency,
        "conclusion": conclusion,
    }

    full_text = (
        f"[Digital Forensics] {digital_forensics}\n\n"
        f"[Contextual Analysis] {contextual_analysis}\n\n"
        f"[Logical Consistency] {logical_consistency}\n\n"
        f"[Conclusion] {conclusion}"
    )

    return {
        "full_text": full_text,
        "sections": sections,
    }
