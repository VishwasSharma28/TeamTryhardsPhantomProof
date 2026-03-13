import re
import easyocr

# Module-level reader — initialised once to avoid repeated model loading
_reader: easyocr.Reader | None = None


def _get_reader() -> easyocr.Reader:
    """Lazily initialise the EasyOCR reader (English + Hindi)."""
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en", "hi"], gpu=False)
    return _reader


# Unicode ranges for Indian scripts
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_TAMIL_RE = re.compile(r"[\u0B80-\u0BFF]")
_TELUGU_RE = re.compile(r"[\u0C00-\u0C7F]")
_KANNADA_RE = re.compile(r"[\u0C80-\u0CFF]")
_MALAYALAM_RE = re.compile(r"[\u0D00-\u0D7F]")
_BENGALI_RE = re.compile(r"[\u0980-\u09FF]")


def extract_text(image_path: str) -> dict:
    """
    Run EasyOCR on the image at image_path and return extracted text data.

    Returns:
        {
            "extracted_text":   str   — all detected text joined into one string,
            "text_blocks":      list  — individual detected text strings,
            "language_detected": str  — "hi"/"ta"/"te"/"kn"/"ml"/"bn" or "en"
        }
    On error returns empty defaults with language_detected = "en".
    """
    try:
        reader = _get_reader()
        results = reader.readtext(image_path)

        # results is a list of (bbox, text, confidence)
        text_blocks = [text for (_bbox, text, _conf) in results]
        full_text = " ".join(text_blocks)

        # Count characters per script
        devanagari_chars = len(_DEVANAGARI_RE.findall(full_text))
        tamil_chars = len(_TAMIL_RE.findall(full_text))
        telugu_chars = len(_TELUGU_RE.findall(full_text))
        kannada_chars = len(_KANNADA_RE.findall(full_text))
        malayalam_chars = len(_MALAYALAM_RE.findall(full_text))
        bengali_chars = len(_BENGALI_RE.findall(full_text))
        total_chars = len([c for c in full_text if c.strip()])

        non_english_chars = devanagari_chars + tamil_chars + telugu_chars + kannada_chars + malayalam_chars + bengali_chars
        ratio = non_english_chars / max(total_chars, 1)

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
