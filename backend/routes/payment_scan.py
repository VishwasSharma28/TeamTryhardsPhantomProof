"""
=============================================================================
payment_scan.py — Fake UPI Payment Receipt & Transaction Fraud Scanner
=============================================================================
ROLE IN THE ARCHITECTURE:
  Scammers frequently use "Prank / Spoof UPI Payment" mobile apps to generate
  counterfeit payment screenshots (Paytm, Google Pay, PhonePe) to trick merchants
  into believing money has been transferred.

HOW IT WORKS (MULTI-MODAL FRAUD SCORING):
  1. Optical Character Recognition (OCR):
     Extracts all text fields from the screenshot.
  2. Financial Field Extraction:
     Extracts the UTR (Unique Transaction Reference), Transfer Amount, Bank Name,
     and Date/Time stamp using regular expressions.
  3. UTR Validity & Pattern Analysis:
     Real UPI UTRs are 12 alphanumeric characters. Spoof generators typically output
     all-numeric patterns, repeated digits (e.g. '111111111111'), or sequential numbers.
  4. Visual Forensics & EXIF Check:
     Runs Error Level Analysis (ELA) to see if the amount was edited or pasted,
     and inspects EXIF metadata for image editors.
  5. Multi-Signal Penalty & Credit Scoring:
     Computes a composite `fraud_score` (0 to 100).
     - <= 30: "Likely Genuine"
     - 31 to 50: "Suspicious"
     - > 50: "Likely Fraud"
=============================================================================
"""

from fastapi import APIRouter, UploadFile, File
from fastapi.concurrency import run_in_threadpool
import os

from models.payment_result import PaymentResult, PaymentAnalysis
from services.ocr_service import extract_text
from services.payment_validator import extract_fields, validate_utr, is_utr_numeric_only, is_amount_suspiciously_round, has_funny_utr_pattern
from services.image_forensics import analyze_ela, extract_exif_metadata, detect_profile_faces, check_copy_move_forgery
from services.layout_checker import check_layout

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

@router.post("/scan/payment", response_model=PaymentResult)
async def scan_payment(file: UploadFile = File(...)):
    """
    HTTP POST Endpoint: /scan/payment
    Receives an uploaded payment screenshot and offloads heavy OCR + CV forensics
    to a worker threadpool to keep the server responsive.
    """
    file_bytes = await file.read()
    filename = file.filename
    # Run OCR + forensics in a worker thread so the event loop stays responsive.
    return await run_in_threadpool(_run_payment_scan, file_bytes, filename)


def _run_payment_scan(file_bytes: bytes, filename: str) -> PaymentResult:
    """
    Executes the receipt forensics pipeline: OCR extraction, UTR check, and fraud scoring.

    Parameters:
        file_bytes: Raw binary content of the uploaded file.
        filename: Name of the uploaded file.

    Returns:
        PaymentResult: Validated fields (amount, bank, UTR) and verdict.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    image_path = os.path.join(UPLOAD_DIR, filename)
    with open(image_path, "wb") as f:
        f.write(file_bytes)
        
    # Step 1: Extract all text visible in the receipt image
    text = extract_text(image_path)
    
    # Step 2: Extract structured financial entities (Amount, UTR, Bank)
    fields = extract_fields(text)
    amount = fields["amount"]
    utr = fields["utr"]
    bank = fields["bank"]
    
    # Step 3: Validate UTR format (must be 12 alphanumeric characters)
    utr_valid = validate_utr(utr)
    invalid_utr = not utr_valid if utr else True
        
    # Step 4: Digital Image Forensics Checks
    ela_result = analyze_ela(image_path)
    tampering_detected = ela_result["tampering_detected"]
    
    exif_data = extract_exif_metadata(image_path)
    suspicious_software = exif_data.get("is_suspicious_software", False)
    
    copy_move_detected = check_copy_move_forgery(image_path)
    has_profile_face = detect_profile_faces(image_path)
    
    # Step 5: UPI Layout Consistency Check
    layout_result = check_layout(fields, text)
    layout_anomaly = layout_result["layout_anomaly"]
    
    # Step 6: Multi-Signal Fraud Scoring
    fraud_score = 0
    explanations = []
    
    text_lower = text.lower()
    # Watermarks or words left behind by spoof APKs (e.g. 'spoof', 'prank payment')
    fake_keywords = ["spoof", "fake", "prank", "demo", "mock", "simulator", "generator"]
    is_spoof_app = any(kw in text_lower for kw in fake_keywords)
    
    success_keywords = ["paid to", "sent", "transaction successful", "payment processing"]
    has_success_label = any(kw in text_lower for kw in success_keywords)
    
    utr_numeric_only = is_utr_numeric_only(utr) if utr else False
    funny_utr = has_funny_utr_pattern(utr) if utr else False
    amount_suspiciously_round = is_amount_suspiciously_round(amount) if amount else False
    
    import re
    time_pattern = re.compile(r"\d{1,2}:\d{2}\s*(am|pm)?", re.IGNORECASE)
    date_pattern = re.compile(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}")
    no_timestamp_found = not (time_pattern.search(text) or date_pattern.search(text))
    
    # Critical Fraud Indicators (High Penalty)
    if is_spoof_app:
        fraud_score += 60  # Definite indicator of fake payment generation software
        explanations.append("🚨 Detected text commonly used by fake/spoof payment generator apps.")
    
    if suspicious_software:
        fraud_score += 50  # Image was modified in an image editing tool
        software_name = exif_data.get('software_signature', 'Editing Software')
        explanations.append(f"🚨 EXIF Metadata indicates this image was edited using {software_name.title()}.")
        
    if copy_move_detected:
        fraud_score += 40  # Duplicated regions detected on the receipt
        explanations.append("🚨 Forensics detected cloned/copy-moved regions in the image.")
        
    if tampering_detected:
        fraud_score += 40  # Inconsistent compression levels (e.g. pasted amount or UTR)
        explanations.append("🚨 Error Level Analysis (ELA) detected signs of digital manipulation or pasted text.")
        
    # UTR Validations (Medium Penalty)
    if invalid_utr:
        fraud_score += 40
        explanations.append("⚠️ Missing or invalid UTR format (must be 12 alphanumeric characters).")
    if funny_utr:
        fraud_score += 30  # Repeating or sequential numbers (e.g. 123456789012)
        explanations.append("⚠️ The UTR contains suspicious repeating or sequential patterns.")
    elif utr_numeric_only:
        fraud_score += 20  # Genuine UPI transaction references almost always contain letters
        explanations.append("⚠️ The UTR contains only numbers, whereas legitimate UPI UTRs usually contain letters.")
        
    # Missing Elements & Minor Anomalies (Low Penalty)
    if not bank:
        fraud_score += 20
        explanations.append("⚠️ No recognizable banking institution could be found on the receipt.")
    if not amount:
        fraud_score += 15
        explanations.append("⚠️ No transaction amount could be found.")
    if amount_suspiciously_round:
        fraud_score += 10
        explanations.append("⚠️ The payment amount is unusually round (exact thousand increment/decrement).")
    if layout_anomaly:
        fraud_score += 5
        explanations.append("ℹ️ Expected UPI receipt details (Amount, UTR, Bank, Date) were not formatted as expected.")
    if no_timestamp_found:
        fraud_score += 5
        explanations.append("ℹ️ Missing a valid transaction date or time.")
        
    # Genuine Adjusters (Credits: decrease the suspicion score)
    if has_success_label:
        fraud_score -= 5
        explanations.append("✅ Detected legitimate transaction success labels.")
    if has_profile_face:
        fraud_score -= 10
        explanations.append("✅ A human face was detected in a profile picture area, increasing legitimacy.")
        
    # Clamp final score between 0 and 100
    fraud_score = max(0, min(100, fraud_score))
    
    if len(explanations) == 0:
        explanations.append("All checks passed. No suspicious patterns were found in the text or image metadata.")
    
    # Final Verdict Thresholding
    if fraud_score <= 30:
        verdict = "Likely Genuine"
    elif fraud_score <= 50:
        verdict = "Suspicious"
    else:
        verdict = "Likely Fraud"
        
    analysis = PaymentAnalysis(
        amount_detected=amount if amount else "None",
        bank_detected=bank if bank else "None",
        utr=utr if utr else "None",
        utr_valid=bool(not invalid_utr),
        tampering_detected=bool(tampering_detected),
        layout_anomaly=bool(layout_anomaly),
        fraud_score=int(fraud_score),
        verdict=str(verdict),
        explanations=explanations
    )
    
    return PaymentResult(payment_analysis=analysis)
