"""
=============================================================================
clip_engine.py — Multimodal Zero-Shot Semantic Image Categorizer
=============================================================================
ROLE IN THE ARCHITECTURE:
  While forensic algorithms inspect raw pixels (ELA, noise) and OCR extracts text,
  CLIP provides HIGH-LEVEL SEMANTIC UNDERSTANDING of the scene.
  It answers: "What KIND of image is this?"
    - Is it a news screenshot?
    - An edited viral meme?
    - An AI-generated synthetic picture?
    - An authentic camera photograph?
    - An official scanned document?

HOW IT WORKS (OPENAI CLIP):
  Uses 'openai/clip-vit-base-patch32' via HuggingFace's zero-shot pipeline.
  CLIP maps both images and natural language text into a shared embedding space.
  By comparing the visual vector with 8 candidate text descriptions, it identifies
  the highest-probability scene category without requiring task-specific training.

SAFETY & FAIL-SAFE DESIGN:
  Designed with graceful degradation: if model loading or inference encounters an
  issue, it logs a warning and returns safe fallback categories so the primary
  forensic scan pipeline never fails for the user.
=============================================================================
"""

from __future__ import annotations

import traceback
from typing import Any

from PIL import Image

# ── Label mappings ────────────────────────────────────────────────────────────

# Natural language prompts passed to CLIP's text encoder
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

# Normalized programmatic identifiers matching the order of CANDIDATE_LABELS
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

# Mapping dictionary: natural language label -> programmatic key
_LABEL_TO_KEY: dict[str, str] = dict(zip(CANDIDATE_LABELS, _INTERNAL_KEYS))

# Contextual forensic observations attached to each detected category
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
    """
    Initializes the HuggingFace zero-shot image classification pipeline once on demand.
    Loads 'openai/clip-vit-base-patch32' on CPU (`device=-1`).
    """
    global _classifier
    if _classifier is not None:
        return _classifier
    try:
        from transformers import pipeline as hf_pipeline

        _classifier = hf_pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
            device=-1,  # CPU execution for portable deployment
        )
        print("[clip_engine] CLIP classifier loaded (openai/clip-vit-base-patch32)")
    except Exception as exc:
        print(f"[clip_engine] CLIP classifier failed to load: {exc}")
        _classifier = None
    return _classifier


# Safe fallback dictionary returned if inference cannot complete
_FALLBACK: dict[str, Any] = {
    "label": "unknown",
    "confidence": 0.0,
    "semantic_flags": [],
    "candidate_scores": {},
}


def classify_image(image_path: str) -> dict[str, Any]:
    """
    Categorizes an image into one of the 8 forensic-relevant semantic classes.

    Parameters:
        image_path (str): File system path to the target image.

    Returns:
        dict:
            - 'label': Winning category key (e.g., 'news_screenshot').
            - 'confidence': Probability score of the top candidate (0.0 to 1.0).
            - 'semantic_flags': Human-readable observations explaining why this class was chosen.
            - 'candidate_scores': Complete probability distribution across all 8 classes.
    """
    try:
        clf = _get_classifier()
        if clf is None:
            return dict(_FALLBACK)

        img = Image.open(image_path).convert("RGB")

        # Runs zero-shot image classification comparing the visual embedding with all text labels
        results = clf(img, candidate_labels=CANDIDATE_LABELS)

        # Map results into internal programmatic keys
        candidate_scores: dict[str, float] = {}
        for item in results:
            key = _LABEL_TO_KEY.get(item["label"], item["label"])
            candidate_scores[key] = round(item["score"], 4)

        # Select the highest-probability winning class
        top = results[0]
        winning_key = _LABEL_TO_KEY.get(top["label"], top["label"])
        winning_confidence = round(top["score"], 4)

        # Retrieve contextual forensic explanation templates for the winning class
        semantic_flags = list(_FLAG_TEMPLATES.get(winning_key, []))

        return {
            "label": winning_key,
            "confidence": winning_confidence,
            "semantic_flags": semantic_flags,
            "candidate_scores": candidate_scores,
        }

    except Exception as exc:
        print(f"[clip_engine] CLIP classify_image error: {exc}")
        traceback.print_exc()
        return dict(_FALLBACK)
