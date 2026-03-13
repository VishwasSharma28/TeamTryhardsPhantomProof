from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import io

# Import the FastAPI app
try:
    from main import app
except ImportError:
    # If main is not in root path, we might need to adjust path
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from main import app

client = TestClient(app)

def test_fraud_scoring():
    # We will mock the extraction functions to simulate different scenarios
    # 1. Very Suspicious Scenario (Missing Bank, Funny UTR, Tampered, Spoof App Text)
    print("Testing Suspicious Scenario...")
    with patch('routes.payment_scan.extract_text') as mock_text, \
         patch('routes.payment_scan.extract_fields') as mock_fields, \
         patch('routes.payment_scan.analyze_ela') as mock_ela, \
         patch('routes.payment_scan.extract_exif_metadata') as mock_exif, \
         patch('routes.payment_scan.check_copy_move_forgery') as mock_copymove, \
         patch('routes.payment_scan.detect_profile_faces') as mock_face, \
         patch('routes.payment_scan.check_layout') as mock_layout:
        
        mock_text.return_value = "This is a spoof payment generator app. 11:30 AM"
        mock_fields.return_value = {"amount": "₹1001", "utr": "111111111111", "bank": ""}
        mock_ela.return_value = {"forensics_score": 80, "tampering_detected": True}
        mock_exif.return_value = {"is_suspicious_software": True, "software_signature": "Photoshop"}
        mock_copymove.return_value = True
        mock_face.return_value = False
        mock_layout.return_value = {"layout_anomaly": True}
        
        # Create a dummy image file
        dummy_image = io.BytesIO(b"fake_image_data")
        dummy_image.name = "test.jpg"
        
        response = client.post(
            "/scan/payment",
            files={"file": ("test.jpg", dummy_image, "image/jpeg")}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        result = response.json()["payment_analysis"]
        
        # Expected score:
        # spoof: 60
        # suspicious_software: 50
        # copy_move_detected: 40
        # tampering_detected: 40
        # (invalid_utr) funny_utr (111111111111 has repeating string): 30
        # not bank: 20
        # amount_suspiciously_round (1001): 10
        # layout_anomaly: 5
        # Total > 100, maxed at 100.
        
        print(f"Score for suspicious scenario: {result['fraud_score']} / 100")
        print("Explanations:")
        for exp in result['explanations']:
            print(f" - {exp}")
            
        assert result['fraud_score'] == 100
        assert "A spoof" in mock_text.return_value or result['fraud_score'] == 100
        
    # 2. Genuine Scenario (Valid UTR, Bank Present, Good Amount, Face Detected, Success Label)
    print("\nTesting Genuine Scenario...")
    with patch('routes.payment_scan.extract_text') as mock_text, \
         patch('routes.payment_scan.extract_fields') as mock_fields, \
         patch('routes.payment_scan.analyze_ela') as mock_ela, \
         patch('routes.payment_scan.extract_exif_metadata') as mock_exif, \
         patch('routes.payment_scan.check_copy_move_forgery') as mock_copymove, \
         patch('routes.payment_scan.detect_profile_faces') as mock_face, \
         patch('routes.payment_scan.check_layout') as mock_layout:
         
        mock_text.return_value = "Transaction successful paid to John Doe. 10:15 PM"
        mock_fields.return_value = {"amount": "₹510", "utr": "312457896432", "bank": "HDFC"}
        mock_ela.return_value = {"forensics_score": 0, "tampering_detected": False}
        mock_exif.return_value = {"is_suspicious_software": False}
        mock_copymove.return_value = False
        mock_face.return_value = True
        mock_layout.return_value = {"layout_anomaly": False}
        
        dummy_image = io.BytesIO(b"fake_image_data")
        dummy_image.name = "test.jpg"
        
        response = client.post(
            "/scan/payment",
            files={"file": ("test.jpg", dummy_image, "image/jpeg")}
        )
        
        assert response.status_code == 200
        result = response.json()["payment_analysis"]
        
        # Expected score:
        # utr_numeric_only: 20
        # has_success_label: -5
        # has_profile_face: -10
        # Total: max(0, 5) = 5
        
        print(f"Score for genuine scenario: {result['fraud_score']} / 100")
        print("Verdict:", result['verdict'])
        print("Explanations:")
        for exp in result['explanations']:
            print(f" - {exp}")
            
        assert result['fraud_score'] == 5
        assert result['verdict'] == "Likely Genuine"

if __name__ == "__main__":
    test_fraud_scoring()
    print("\nAll tests passed successfully!")
