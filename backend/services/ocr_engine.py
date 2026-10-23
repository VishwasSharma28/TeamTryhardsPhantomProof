"""
=============================================================================
ocr_engine.py — Multilingual Text Recognition & Script Detector
=============================================================================
ROLE IN THE ARCHITECTURE:
  Extracts embedded textual claims from uploaded screenshots, viral forwards,
  and digital documents. Once text is extracted, it feeds downstream into:
    1. OSINT fact-checking agent (to match viral claims against AltNews/PIB).
    2. Misinformation timeline engine (to find historical case matches).
    3. Multilingual language detector (to translate non-English regional text).

TECHNOLOGY:
  Uses EasyOCR (PyTorch backend with CRAFT text detector and ResNet-LSTM
  recognition models) for English and Hindi script recognition.
=============================================================================
"""

import re
import easyocr

# Module-level reader singleton — loaded once in memory to avoid 5-10s reloading on every request
_reader: easyocr.Reader | None = None


def _get_reader() -> easyocr.Reader:
    """
    Lazily initializes the EasyOCR reader with English ('en') and Hindi ('hi') models.
    Running on CPU (`gpu=False`) ensures universal compatibility on cloud hosts like Render.
    """
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en", "hi"], gpu=False)
    return _reader


# Unicode range regular expressions for Indian regional scripts
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")  # Hindi, Marathi, Sanskrit
_TAMIL_RE = re.compile(r"[\u0B80-\u0BFF]")       # Tamil
_TELUGU_RE = re.compile(r"[\u0C00-\u0C7F]")      # Telugu
_KANNADA_RE = re.compile(r"[\u0C80-\u0CFF]")     # Kannada
_MALAYALAM_RE = re.compile(r"[\u0D00-\u0D7F]")   # Malayalam
_BENGALI_RE = re.compile(r"[\u0980-\u09FF]")     # Bengali


def extract_text(image_path: str) -> dict:
    """
    Runs optical character recognition on an image file and determines the primary script.

    Parameters:
        image_path (str): Local file path of the image.

    Returns:
        dict:
            - 'extracted_text': Space-separated concatenated string of all text found.
            - 'text_blocks': List of individual text fragments detected across bounding boxes.
            - 'language_detected': Language code ('en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn').
    """
    try:
        reader = _get_reader()
        # results format: [ (bounding_box_coordinates, text_string, confidence_score), ... ]
        results = reader.readtext(image_path)

        # Extract only the text strings from all bounding boxes
        text_blocks = [text for (_bbox, text, _conf) in results]
        full_text = " ".join(text_blocks)

        # Count character frequencies across Unicode script ranges
        devanagari_chars = len(_DEVANAGARI_RE.findall(full_text))
        tamil_chars = len(_TAMIL_RE.findall(full_text))
        telugu_chars = len(_TELUGU_RE.findall(full_text))
        kannada_chars = len(_KANNADA_RE.findall(full_text))
        malayalam_chars = len(_MALAYALAM_RE.findall(full_text))
        bengali_chars = len(_BENGALI_RE.findall(full_text))
        total_chars = len([c for c in full_text if c.strip()])

        non_english_chars = devanagari_chars + tamil_chars + telugu_chars + kannada_chars + malayalam_chars + bengali_chars
        ratio = non_english_chars / max(total_chars, 1)

        # If more than 15% of characters belong to an Indic script, classify accordingly
        if ratio > 0.15:
            if devanagari_chars >= max(tamil_chars, telugu_chars, kannada_chars, malayalam_chars, bengali_chars):
                language_detected = "hi"
            elif tamil_chars == max(tamil_chars, telugu_chars, kannada_chars, malayalam_chars, bengali_chars):
                language_detected = "ta"
            elif telugu_chars == max(telugu_chars, kannada_chars, malayalam_chars, bengali_chars):
                language_detected = "te"
            elif kannada_chars == max(kannada_chars, malayalam_chars, bengali_chars):
                language_detected = "kn"
            elif malayalam_chars >= bengali_chars:
                language_detected = "ml"
            else:
                language_detected = "bn"
        else:
            language_detected = "en"

        return {
            "extracted_text": full_text,
            "text_blocks": text_blocks,
            "language_detected": language_detected,
        }

    except Exception as e:
        print(f"[ocr_engine] extract_text error: {e}")
        return {
            "extracted_text": "",
            "text_blocks": [],
            "language_detected": "en",
        }
