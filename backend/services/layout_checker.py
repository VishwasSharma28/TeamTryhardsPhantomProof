import re

def check_layout(extracted_fields: dict, text: str) -> dict:
    text_lower = text.lower()
    
    REQUIRED_KEYWORDS = [
        ['amount', 'amt', '₹', 'rs', 'inr'],
        ['utr', 'ref', 'reference', 'transaction id', 'txn'],
        ['bank', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'paytm', 'phonepe', 'gpay', 'google pay'],
        ['success', 'successful', 'completed', 'debited', 'paid', 'sent'],
    ]

    missing_groups = sum(
        1 for group in REQUIRED_KEYWORDS
        if not any(kw in text_lower for kw in group)
    )
    
    time_pattern = re.compile(r"\d{1,2}:\d{2}\s*(am|pm)?", re.IGNORECASE)
    date_pattern = re.compile(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}")
    has_date_time = time_pattern.search(text) or date_pattern.search(text)
    if not has_date_time:
        missing_groups += 1
         
    layout_anomaly = missing_groups >= 2
    
    return {
        "layout_anomaly": layout_anomaly,
        "missing_count": missing_groups
    }
