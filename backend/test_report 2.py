import sys
import traceback
from services.report_generator import generate_pdf_report

try:
    data = {
        'file_id': 'test',
        'authenticity_score': 50.0,
        'threat_category': 'UNKNOWN',
        'risk_level': 'UNKNOWN',
        'extracted_text': '',
        'verdict': 'UNVERIFIED',
        'matched_sources': [],
        'flags': []
    }
    with open("test_out.pdf", "wb") as f:
        f.write(generate_pdf_report(data))
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    traceback.print_exc()
