import os
from services import forensics_engine, ocr_engine, osint_agent, ai_image_detector
import sys

# find the real file in uploads dir
uploads = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
files = os.listdir(uploads)
if not files:
    print("No files to analyze")
    sys.exit(1)

file_id = files[-1] # take recent file
print(f"Analyzing {file_id}")

try:
    print("1. forensics_engine.analyze_image")
    forensics_result = forensics_engine.analyze_image(file_id)
    print("Forensics done.")
    
    print("2. ocr_engine.extract_text")
    image_path = os.path.join(uploads, file_id)
    ocr_result = ocr_engine.extract_text(image_path)
    print("OCR done.")

    print("3. osint_agent.verify_claim")
    extracted_text: str = ocr_result.get("extracted_text", "")
    osint_result = osint_agent.verify_claim(extracted_text)
    print("OSINT done.")

except Exception as e:
    import traceback
    traceback.print_exc()
