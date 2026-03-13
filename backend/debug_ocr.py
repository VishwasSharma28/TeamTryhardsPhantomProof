import os
from services.ocr_service import extract_text
from services.payment_validator import extract_fields

upload_dir = r"C:\Users\Dell\OneDrive\Desktop\TeamTryhardsPhantomProof\uploads"
for filename in os.listdir(upload_dir):
    if filename.endswith(".jpg"):
        filepath = os.path.join(upload_dir, filename)
        try:
            text = extract_text(filepath)
            fields = extract_fields(text)
            print(f"--- {filename} ---")
            print("OCR TEXT:", repr(text))
            print("FIELDS:", fields)
        except Exception as e:
            print(f"Skipping {filename}: {e}")
