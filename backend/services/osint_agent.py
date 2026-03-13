import json
from typing import Dict

def verify_claim(claim_text: str) -> Dict:
    claim_lower = claim_text.lower()
    
    demo_patterns = {
        'lockdown': {'verdict': 'FALSE', 'fingerprint': 'LOCKDOWN_HOAX_2021'},
        'upi': {'verdict': 'SCAM', 'fingerprint': 'UPI_FRAUD_V3'},
        'government': {'verdict': 'UNVERIFIED', 'fingerprint': 'FAKE_CIRCULAR'},
        'pm modi': {'verdict': 'FALSE', 'fingerprint': 'PM_QUOTE_FAKE'}
    }
    
    for keyword, result in demo_patterns.items():
        if keyword in claim_lower:
            return {
                'verdict': result['verdict'],
                'fingerprint_match': result['fingerprint'],
                'explanation': f'Matches known {keyword} misinformation pattern',
                'matched_sources': ['AltNews', 'PIB', 'BOOM']
            }
    
    return {'verdict': 'UNVERIFIED', 'explanation': 'No known fingerprint match'}
