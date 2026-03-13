import re

# Match ₹ or Rs/INR then amount
def extract_fields(text: str) -> dict:
    
    amount = ""
    AMOUNT_PATTERN = r'[₹2Z]\s?(\d+(?:,\d{3})*(?:\.\d{2})?)'
    match = re.search(AMOUNT_PATTERN, text, re.IGNORECASE)
    
    if match:
        amount = '₹' + match.group(1).replace(',', '').strip()

    utr_match = re.search(r"\b[A-Z0-9]{12}\b", text)
    utr = utr_match.group(0).strip() if utr_match else ""

    bank = ""
    # The bank is usually detected after @ in the profile id for UPI
    upi_match = re.search(r'[a-zA-Z0-9.\-_]+@([a-zA-Z]+)', text)
    if upi_match:
        bank_candidate = upi_match.group(1).upper()
        if len(bank_candidate) > 2:
            bank = bank_candidate
            # Clean up common upi bank prefixes e.g. okaxis -> axis, oksbi -> sbi
            if bank.startswith("OK"):
                bank = bank[2:]
            elif bank.startswith("YBL"):
                bank = "YESBANK"
            elif bank.startswith("IBL"):
                bank = "ICICI"
    
    if not bank or len(bank) <= 2:
        # Fallback to general text match if no valid UPI ID found
        BANKS = ["HDFC", "SBI", "ICICI", "Axis", "Kotak", "Paytm", "PhonePe", "Google Pay"]
        text_lower = text.lower()
        for b in BANKS:
            if b.lower() in text_lower:
                bank = b
                break
                
    return {
        "amount": amount,
        "utr": utr,
        "bank": bank
    }

def validate_utr(utr: str) -> bool:
    if not utr or len(utr) != 12:
        return False
        
    # Standard UPI UTRs in India are exactly 12 digits.
    # If the screenshot has letters in it, it's highly likely a fake generator app
    if not utr.isdigit():
        return False
        
    return True

def is_utr_numeric_only(utr: str) -> bool:
    return utr.isdigit()  # Legitimate UTRs contain both letters and digits

def is_amount_suspiciously_round(amount_str: str) -> bool:
    if not amount_str:
        return False
    digits = re.sub(r'[^\d]', '', amount_str)
    val = int(digits) if digits else 0
    
    # If it's a multiple of 5, the user requested to NOT consider it suspicious
    if val > 0 and val % 5 == 0:
        return False
        
    # Check for mid-values (not ending in 0 or 5).
    # Specifically, check if it's an increment/decrement of a round number (e.g. 1001, 499)
    if val > 100:
        if (val + 1) % 100 == 0 or (val - 1) % 100 == 0:
            return True # e.g. 499, 1001
            
    return False

def has_funny_utr_pattern(utr: str) -> bool:
    if not utr:
        return False
    
    # Check for repeated strings of length 5 or more (e.g. 11111, AAAAA)
    if re.search(r'(.)\1{4,}', utr):
        return True
        
    # Check for common sequential patterns
    sequences = ['123456', '012345', 'qwerty', 'abcdef']
    utr_lower = utr.lower()
    for seq in sequences:
        if seq in utr_lower:
            return True
            
    return False
