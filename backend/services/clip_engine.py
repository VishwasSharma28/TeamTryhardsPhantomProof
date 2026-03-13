"""
clip_engine.py
Lightweight CLIP-based semantic image classifier for PHANTOMPROOF.ai.

Uses HuggingFace transformers zero-shot image classification
(openai/clip-vit-base-patch32) to categorise uploaded images into
forensic-relevant types such as "news_screenshot", "edited_meme", etc.

Designed to fail gracefully — CLIP failure never breaks the scan pipeline.
"""

from __future__ import annotations

import traceback
from typing import Any

from PIL import Image

# ── Label mappings ────────────────────────────────────────────────────────────

# Human-readable labels used as CLIP candidate texts
CANDIDATE_LABELS: list[str] = [
    "authentic photograph",
    "news screenshot",
    "social media post",
    "edited meme",
    "ai generated image",
    "scanned document",
    "manipulated graphic",
    "digital poster",
]

# Normalised internal key for each candidate (same order)
_INTERNAL_KEYS: list[str] = [
    "authentic_photograph",
    "news_screenshot",
    "social_media_post",
    "edited_meme",
    "ai_generated_image",
    "scanned_document",
    "manipulated_graphic",
    "digital_poster",
]

# Map human-readable → internal key
_LABEL_TO_KEY: dict[str, str] = dict(zip(CANDIDATE_LABELS, _INTERNAL_KEYS))

# Semantic-flag templates keyed by internal label
_FLAG_TEMPLATES: dict[str, list[str]] = {
    "authentic_photograph": [
        "visual composition is consistent with an authentic camera photograph",
        "no significant indicators of post-processing or synthetic generation",
    ],
    "news_screenshot": [
        "text-heavy layout resembles a screenshot rather than a camera photo",
        "visual composition is more consistent with captured screen content",
    ],
    "social_media_post": [
        "layout and framing resemble a social media post or story",
        "content appears curated for online sharing platforms",
    ],
    "edited_meme": [
        "overlaid text and visual style are consistent with meme templates",
        "image shows signs of composite editing typical of meme creation",
    ],
    "ai_generated_image": [
        "visual features suggest possible AI or machine-generated origin",
        "texture and lighting patterns are consistent with synthetic image generation",
    ],
    "scanned_document": [
        "image resembles a scanned or photographed printed document",
        "layout structure is consistent with official or semi-official paperwork",
    ],
    "manipulated_graphic": [
        "visual evidence suggests deliberate graphic manipulation",
        "composition shows signs of splicing, cloning, or layer-based editing",
    ],
    "digital_poster": [
        "design elements are consistent with a digitally created poster or flyer",
        "visual layout prioritises branded or promotional content",
    ],
}

# ── Lazy-loaded classifier singleton ──────────────────────────────────────────

_classifier = None


def _get_classifier():
    """Load the CLIP pipeline once, on first use."""
    global _classifier
    if _classifier is not None:
        return _classifier
    try:
        from transformers import pipeline as hf_pipeline

        _classifier = hf_pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
            device=-1,  # CPU — safe for all environments
        )
        print("✅ CLIP classifier loaded (openai/clip-vit-base-patch32)")
    except Exception as exc:
        print(f"⚠️  CLIP classifier failed to load: {exc}")
        _classifier = None
    return _classifier


# ── Safe fallback ─────────────────────────────────────────────────────────────

_FALLBACK: dict[str, Any] = {
    "label": "unknown",
    "confidence": 0.0,
    "semantic_flags": [],
    "candidate_scores": {},
}


# ── Public API ────────────────────────────────────────────────────────────────


def classify_image(image_path: str) -> dict[str, Any]:
    """
    Classify an image into one of the forensic-relevant semantic categories.

    Parameters
    ----------
    image_path : str
        Absolute path to the image file on disk.

    Returns
    -------
    dict with keys:
        label            – internal normalised label (str)
        confidence       – 0.0-1.0 float for the winning label
        semantic_flags   – list[str] human-readable observations
        candidate_scores – dict[str, float] all candidate scores
    """
    try:
        clf = _get_classifier()
        if clf is None:
            return dict(_FALLBACK)

        img = Image.open(image_path).convert("RGB")

        results = clf(img, candidate_labels=CANDIDATE_LABELS)
        # results is a list of dicts: [{"label": ..., "score": ...}, ...]

        # Build candidate_scores mapping (internal_key → score)
        candidate_scores: dict[str, float] = {}
        for item in results:
            key = _LABEL_TO_KEY.get(item["label"], item["label"])
            candidate_scores[key] = round(item["score"], 4)

        # Winner
        top = results[0]
        winning_key = _LABEL_TO_KEY.get(top["label"], top["label"])
        winning_confidence = round(top["score"], 4)

        # Semantic flags for the winning label
        semantic_flags = list(_FLAG_TEMPLATES.get(winning_key, []))

        return {
            "label": winning_key,
            "confidence": winning_confidence,
            "semantic_flags": semantic_flags,
            "candidate_scores": candidate_scores,
        }

    except Exception as exc:
        print(f"⚠️  CLIP classify_image error: {exc}")
        traceback.print_exc()
        return dict(_FALLBACK)
