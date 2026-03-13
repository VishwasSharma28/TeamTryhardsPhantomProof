# backend/services/ai_image_detector.py

import numpy as np
import cv2
from PIL import Image


def detect_ai_generated(image_path: str) -> dict:
    """
    Detects AI-generated images using 3 heuristics:
    1. Frequency smoothness (AI images are unnaturally smooth)
    2. Color uniformity (AI images have uniform color distribution)
    3. Perfect dimensions + no EXIF (common AI signature)
    """
    try:
        img = Image.open(image_path).convert("RGB")
        arr = np.array(img)
        score = 100.0
        flags = []

        # Heuristic 1: Frequency analysis
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        f = np.fft.fft2(gray)
        magnitude = 20 * np.log(np.abs(np.fft.fftshift(f)) + 1)
        high_freq = magnitude[magnitude > magnitude.mean() * 1.5]
        if len(high_freq) > 0 and high_freq.mean() < 45:
            score -= 30
            flags.append("suspiciously_smooth_frequency")

        # Heuristic 2: Color uniformity
        if arr.std(axis=(0, 1)).mean() < 45:
            score -= 25
            flags.append("unnatural_color_uniformity")

        # Heuristic 3: Perfect dimensions + no EXIF
        try:
            exif = img._getexif()
        except Exception:
            exif = None
        w, h = img.size
        if exif is None and (w % 64 == 0 and h % 64 == 0):
            score -= 25
            flags.append("ai_signature_dimensions_no_exif")

        is_ai = score < 50

        return {
            "ai_generated_score": round(100 - score, 1),
            "is_likely_ai": is_ai,
            "ai_flags": flags,
            "ai_verdict": "AI_GENERATED" if is_ai else "LIKELY_REAL",
        }

    except Exception as e:
        print(f"[ai_image_detector] error: {e}")
        return {
            "ai_generated_score": 0.0,
            "is_likely_ai": False,
            "ai_flags": [],
            "ai_verdict": "UNKNOWN",
        }