from pydantic import BaseModel

class PaymentAnalysis(BaseModel):
    amount_detected: str
    bank_detected: str
    utr: str
    utr_valid: bool
    tampering_detected: bool
    layout_anomaly: bool
    fraud_score: int
    verdict: str
    explanations: list[str]

class PaymentResult(BaseModel):
    payment_analysis: PaymentAnalysis
