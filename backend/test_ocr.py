from services.ocr_service import extract_text
text = extract_text("test_receipt_valid.jpg")
print("OCR Extracted Text:")
print(text)
