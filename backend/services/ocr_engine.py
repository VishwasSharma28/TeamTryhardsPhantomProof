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


# Unicode range for Devanagari (Hindi) script
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")


def extract_text(image_path: str) -> dict:
    """
    Run EasyOCR on the image at image_path and return extracted text data.

    Returns:
        {
            "extracted_text":   str   — all detected text joined into one string,
            "text_blocks":      list  — individual detected text strings,
            "language_detected": str  — "hi" if Hindi characters found, else "en"
        }
    On error returns empty defaults with language_detected = "en".
    """
    try:
        reader = _get_reader()
        results = reader.readtext(image_path)

        # results is a list of (bbox, text, confidence)
        text_blocks = [text for (_bbox, text, _conf) in results]
        full_text = " ".join(text_blocks)

        # Detect Hindi by checking for Devanagari Unicode characters
        language_detected = "hi" if _DEVANAGARI_RE.search(full_text) else "en"

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
