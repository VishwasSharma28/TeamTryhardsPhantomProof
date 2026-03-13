"""
timeline_engine.py
Misinformation Timeline Reconstruction Engine for PHANTOMPROOF.ai.

Uses sentence-transformers to semantically match extracted OCR text against
known misinformation cases. If a match is found, reconstructs the historical
spread timeline. Designed to fail gracefully — missing datasets or lack of
matches will never crash the pipeline.
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
    """Load the sentence transformer model once, on first use."""
    global _encoder
    if _encoder is not None:
        return _encoder
    try:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        print("✅ Timeline Engine text encoder loaded (all-MiniLM-L6-v2)")
    except Exception as exc:
        print(f"⚠️  Timeline Engine encoder failed to load: {exc}")
        _encoder = None
    return _encoder


def _load_dataset() -> list[dict[str, Any]]:
    """Safely load the misinformation cases dataset."""
    global _dataset_cache
    if _dataset_cache is not None:
        return _dataset_cache

    dataset_path = os.path.join("data", "misinformation_cases.json")
    try:
        if not os.path.exists(dataset_path):
            print(f"⚠️  Timeline Engine dataset not found: {dataset_path}")
            _dataset_cache = []
            return _dataset_cache
            
        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                _dataset_cache = data
            else:
                print("⚠️  Timeline Engine dataset is not a JSON array.")
                _dataset_cache = []
    except Exception as exc:
        print(f"⚠️  Timeline Engine failed to load dataset: {exc}")
        _dataset_cache = []
        
    return _dataset_cache


# ── Public API ────────────────────────────────────────────────────────────────

def generate_timeline(analysis_results: dict[str, Any]) -> dict[str, Any]:
    """
    Match OCR text against misinformation dataset and reconstruct a timeline.

    Parameters
    ----------
    analysis_results : dict
        Dict containing at minimum 'ocr_text'.

    Returns
    -------
    dict with keys:
        timeline             – list[dict] of chronological events
        timeline_explanation – str natural language narrative
        matched_case         – dict structure or None
    """
    
    # 1. Fallback base representation
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
        if len(ocr_text) < 10:
            return fallback

        dataset = _load_dataset()
        if not dataset:
            return fallback

        encoder = _get_encoder()
        if encoder is None:
            return fallback
            
        # 2. Compute similarity
        # In a real system you'd vectorize the dataset once and use FAISS.
        # For a hackathon / minimal scale, iterating is completely fine.
        best_match = None
        best_sim = -1.0
        
        # We need cosine similarity from scipy
        from scipy.spatial.distance import cosine
        
        ocr_vector = encoder.encode(ocr_text)
        
        for case in dataset:
            claim = str(case.get("claim", ""))
            if not claim:
                continue
                
            claim_vector = encoder.encode(claim)
            
            # cosine() returns distance (0 to 2), so sim is 1 - distance
            sim = 1.0 - float(cosine(ocr_vector, claim_vector))
            
            if sim > best_sim:
                best_sim = sim
                best_match = case

        # 3. Handle matches
        if best_match is None or best_sim < 0.65:
            # Threshold ensures weak matches are rejected
            return fallback
            
        # 4. Reconstruct timeline events
        timeline = best_match.get("timeline", [])
        
        # If the dataset case doesn't have an explicit timeline array, build a basic one
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

        # 6. Generate narrative
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
        print(f"⚠️  Timeline Engine generated an error: {exc}")
        traceback.print_exc()
        return fallback
