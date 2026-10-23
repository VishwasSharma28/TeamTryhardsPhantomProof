"""
=============================================================================
timeline_engine.py — Misinformation Timeline Reconstruction Engine
=============================================================================
ROLE IN THE ARCHITECTURE:
  One of the most dangerous forms of deception is "recycled misinformation" —
  an old photograph from an earthquake or protest in 2018 recirculated in 2026
  with a brand new fake caption.

HOW IT WORKS (SEMANTIC VECTOR SEARCH):
  1. Dense Embedding:
     Uses Sentence-Transformers ('all-MiniLM-L6-v2') to convert the raw OCR
     text into a 384-dimensional semantic embedding vector.
  2. Cosine Similarity Matching:
     Compares this vector against a curated knowledge bank of known historical
     misinformation cases (`data/misinformation_cases.json`).
  3. Timeline Chronology Reconstruction:
     If cosine similarity exceeds the 0.65 (65%) threshold, it reconstructs:
       - When the image was originally taken (Original Date).
       - When it was weaponized / recirculated with a fake claim (Misuse Date).
       - When fact-checkers verified it and what sources covered it.

SAFETY & FAIL-SAFE DESIGN:
  If no match is found, or if embeddings cannot be computed, it gracefully
  returns an informative empty timeline so the primary scan pipeline never breaks.
=============================================================================
"""

from __future__ import annotations

import json
import os
import traceback
from typing import Any

# ── Lazy-loaded semantic matcher singleton ────────────────────────────────────

_encoder = None
_dataset_cache: list[dict[str, Any]] | None = None


def _get_encoder():
    """
    Loads the SentenceTransformer 'all-MiniLM-L6-v2' model once into memory.
    Transforms raw text sentences into 384-dimensional dense vectors on CPU.
    """
    global _encoder
    if _encoder is not None:
        return _encoder
    try:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        print("[timeline_engine] Text encoder loaded (all-MiniLM-L6-v2)")
    except Exception as exc:
        print(f"[timeline_engine] Text encoder failed to load: {exc}")
        _encoder = None
    return _encoder


def _load_dataset() -> list[dict[str, Any]]:
    """
    Safely loads the ground-truth misinformation database from data/misinformation_cases.json.
    Uses 'utf-8-sig' encoding to automatically handle byte order marks (BOM).
    """
    global _dataset_cache
    if _dataset_cache is not None:
        return _dataset_cache

    dataset_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "misinformation_cases.json")
    )
    try:
        if not os.path.exists(dataset_path):
            print(f"[timeline_engine] Dataset not found: {dataset_path}")
            _dataset_cache = []
            return _dataset_cache
            
        with open(dataset_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            if isinstance(data, list):
                _dataset_cache = data
            else:
                print("[timeline_engine] Dataset is not a JSON array.")
                _dataset_cache = []
    except Exception as exc:
        print(f"[timeline_engine] Failed to load dataset: {exc}")
        _dataset_cache = []
        
    return _dataset_cache


# ── Public API ────────────────────────────────────────────────────────────────

def generate_timeline(analysis_results: dict[str, Any]) -> dict[str, Any]:
    """
    Matches extracted OCR text against known misinformation cases to construct a timeline.

    Parameters:
        analysis_results (dict): Dictionary containing 'ocr_text'.

    Returns:
        dict:
            - 'timeline': List of chronological events sorted by date.
            - 'timeline_explanation': Human-readable narrative detailing when the claim evolved.
            - 'matched_case': Information about the matching historical case (similarity, ID, refs).
    """
    
    # 1. Fallback base representation returned when no match exists
    fallback = {
        "timeline": [],
        "timeline_explanation": (
            "No historically similar misinformation case was found in the local dataset, "
            "so a chronological reconstruction could not be established with confidence."
        ),
        "matched_case": None,
    }

    try:
        ocr_text = (analysis_results.get("ocr_text") or "").strip()
        # Require at least 10 characters to perform semantic search
        if len(ocr_text) < 10:
            return fallback

        dataset = _load_dataset()
        if not dataset:
            return fallback

        encoder = _get_encoder()
        if encoder is None:
            return fallback
            
        # 2. Compute similarity via Cosine Distance
        # Vectorize the extracted OCR claim text
        best_match = None
        best_sim = -1.0
        
        from scipy.spatial.distance import cosine
        
        ocr_vector = encoder.encode(ocr_text)
        
        # Compare query vector with every known claim in the dataset
        for case in dataset:
            claim = str(case.get("claim", ""))
            if not claim:
                continue
                
            claim_vector = encoder.encode(claim)
            
            # scipy.spatial.distance.cosine returns distance (0=identical, 1=orthogonal).
            # Similarity = 1.0 - distance.
            sim = 1.0 - float(cosine(ocr_vector, claim_vector))
            
            if sim > best_sim:
                best_sim = sim
                best_match = case

        # 3. Match Threshold Check: Require at least 65% semantic similarity
        if best_match is None or best_sim < 0.65:
            return fallback
            
        # 4. Reconstruct timeline events
        timeline = best_match.get("timeline", [])
        
        # If case doesn't have an explicit timeline array, synthesize one from metadata dates
        if not timeline:
            if best_match.get("original_date"):
                timeline.append({
                    "date": best_match["original_date"],
                    "event": f"Original context: {best_match.get('original_context', 'Published online.')}",
                    "source": "Historical record",
                    "confidence": 0.90
                })
            if best_match.get("misuse_date"):
                timeline.append({
                    "date": best_match["misuse_date"],
                    "event": "Content was republished with altered or misleading claims.",
                    "source": "Social media archive",
                    "confidence": 0.85
                })
        
        # Sort chronologically by date
        timeline = sorted(timeline, key=lambda x: x.get("date", "9999"))

        # 5. Build matched case structure
        matched_case = {
            "claim": best_match.get("claim", "Unknown claim"),
            "similarity": round(best_sim, 2),
            "case_id": best_match.get("case_id", "Unknown ID"),
            "verdict": best_match.get("verdict", "UNVERIFIED"),
            "references": best_match.get("references", []),
        }

        # 6. Generate natural language timeline narrative
        verdict = best_match.get("verdict", "MISLEADING").upper()
        
        parts = [
            "Misinformation Timeline:\n"
            "The uploaded content appears semantically similar to a previously documented misinformation case "
            f"({best_sim:.0%} match confidence)."
        ]
        
        if best_match.get("original_context"):
            parts.append(
                f"Historical records indicate that the original media was "
                f"first published in a different context: '{best_match['original_context']}'."
            )
        else:
            parts.append(
                "The original image was first published in a legitimate news context before later "
                "being recirculated with altered framing."
            )
            
        if verdict == "FALSE":
            parts.append(
                "Fact-checkers have conclusively documented that the image "
                "predates the claim shown in the uploaded content and was reused in a highly misleading context."
            )
        elif verdict in ("MISLEADING", "SCAM"):
            parts.append(
                "Fact-checkers have flagged similar claims as highly misleading, "
                "as the media was purposefully recirculated to deceive viewers."
            )

        refs = best_match.get("references")
        if refs:
            parts.append(f"Referenced by: {', '.join(refs) if isinstance(refs, list) else refs}.")

        timeline_explanation = " ".join(parts)

        return {
            "timeline": timeline,
            "timeline_explanation": timeline_explanation,
            "matched_case": matched_case,
        }

    except Exception as exc:
        print(f"[timeline_engine] Timeline generation error: {exc}")
        traceback.print_exc()
        return fallback
