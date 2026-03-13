import easyocr
import re

reader = easyocr.Reader(['en', 'hi'], gpu=False)

def clean_ocr_text(raw_text: str) -> str:
    # Translate Hindi digits to English
    hi_digits = '०१२३४५६७८९'
    en_digits = '0123456789'
    trans = str.maketrans(hi_digits, en_digits)
    raw_text = raw_text.translate(trans)
    
    # Fix ₹ symbol commonly misread as '2', 'Z', 'z', 'र', or '?'
    raw_text = re.sub(r'(?<!\d)\b2(?=\s?\d)', '₹', raw_text)
    raw_text = raw_text.replace('Z ', '₹').replace('z ', '₹')
    raw_text = raw_text.replace('र', '₹').replace('?', '₹')
    
    # Normalize amount lines like "2 2000" → "₹2000"
    raw_text = re.sub(r'\b2\s+(\d[\d,]*)', r'₹\1', raw_text)
    return raw_text

def extract_text(image_path: str) -> str:
    results = reader.readtext(image_path, detail=0, paragraph=True)
    return clean_ocr_text(" ".join(results))
