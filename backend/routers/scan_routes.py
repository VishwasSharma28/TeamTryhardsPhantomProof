import os
import json
import hashlib
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from limiter import limiter
from services import forensics_engine, osint_agent, supabase_client, ocr_engine, ai_image_detector, ai_detector
from services import report_generator
from services import clip_engine
from services.explanation_engine import generate_explanation
from services.timeline_engine import generate_timeline

router = APIRouter()

# ── Demo cache (loaded once at import time) ───────────────────────────────────
_DEMO_CACHE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo_cache.json")
)
try:
    with open(_DEMO_CACHE_PATH, "r", encoding="utf-8") as _f:
        DEMO_CACHE: dict = json.load(_f)
except Exception as _e:
    print(f"[scan_routes] Warning: could not load demo_cache.json — {_e}")
    DEMO_CACHE = {}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _outputs_dir() -> str:
    path = os.path.join(_repo_root(), "outputs")
    os.makedirs(path, exist_ok=True)
    return path


def _uploads_dir() -> str:
    path = os.path.join(_repo_root(), "uploads")
    os.makedirs(path, exist_ok=True)
    return path


# ── Demo scenarios for /osint/verify ─────────────────────────────────────────
DEMO_SCENARIOS: dict[str, dict] = {
    "lockdown": {
        "verdict": "FALSE",
        "fingerprint_match": "LOCKDOWN_HOAX_2021",
        "explanation": "Matches known lockdown misinformation pattern",
        "matched_sources": ["AltNews", "PIB", "BOOM"],
    },
    "upi_fraud": {
        "verdict": "SCAM",
        "fingerprint_match": "UPI_FRAUD_V3",
        "explanation": "Matches known UPI fraud pattern",
        "matched_sources": ["AltNews", "CERT-In", "PIB"],
    },
    "fake_circular": {
        "verdict": "UNVERIFIED",
        "fingerprint_match": "FAKE_CIRCULAR",
        "explanation": "Matches known fake government circular pattern",
        "matched_sources": ["PIB"],
    },
    "pm_quote": {
        "verdict": "FALSE",
        "fingerprint_match": "PM_QUOTE_FAKE",
        "explanation": "Matches known fabricated PM quote pattern",
        "matched_sources": ["AltNews", "BOOM"],
    },
}

# ── Pydantic models ───────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    file_id: str

class OSINTRequest(BaseModel):
    claim_text: str
    demo_mode: Optional[str] = None

class ReportRequest(BaseModel):
    file_id: str
    authenticity_score: float
    threat_category: str
    risk_level: str
    extracted_text: str
    verdict: str
    matched_sources: list[str] = []
    flags: list[str] = []
    # New fields for better report generation
    executive_summary: str = ""
    ai_ensemble: dict = {}
    explainability: dict = {}
    explanation: dict = {}
    timeline_analysis: dict = {}
    visualizations: dict = {}
    signal_breakdown: dict = {}

# ─────────────────────────────────────────────────────────────────────────────
# 1. GET /health
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ─────────────────────────────────────────────────────────────────────────────
# 2. POST /upload/  [rate-limited: 30/minute]
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "application/pdf"}

@router.post("/upload/")
@limiter.limit("30/minute")
async def upload_file(request: Request, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: jpeg, png, jpg, pdf.",
        )

    file_bytes = await file.read()
    filename = file.filename

    # Always save locally first (forensics engine reads from uploads/)
    supabase_client.save_file_locally(file_bytes, filename)

    # Try Supabase upload; fall back gracefully
    try:
        upload_result = supabase_client.upload_file(file_bytes, filename)
        url = upload_result.get("url") or f"local://{filename}"
    except Exception:
        url = f"local://{filename}"

    scan_id = supabase_client.create_scan_record(filename, filename, url)

    return {
        "file_id": filename,
        "url": url,
        "filename": filename,
        "scan_id": scan_id,
    }

# ─────────────────────────────────────────────────────────────────────────────
# 3. POST /scan/image (NEW Multilingual Explainable API)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/scan/image")
@router.post("/scan/video")
async def scan_image(request: Request, lang: str = "en", file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename = file.filename
    supabase_client.save_file_locally(file_bytes, filename)
    
    # Run forensics
    forensics_result = forensics_engine.analyze_image(filename)
    
    # OCR + OSINT
    image_path = os.path.join(_uploads_dir(), filename)
    ocr_result = ocr_engine.extract_text(image_path)
    extracted_text = ocr_result.get("extracted_text", "")
    osint_result = osint_agent.verify_claim(extracted_text)
    
    # AI Detection Ensemble (Production mode)
    ai_ensemble_result = ai_detector.detector.detect_real_ai(image_path)
    
    # CLIP Semantic Classification (safe — never breaks the pipeline)
    clip_result = clip_engine.classify_image(image_path)
    
    # Extract scores for explanation engine
    ela_score = forensics_result.get("signal_breakdown", {}).get("ela", 0)
    metadata_score = forensics_result.get("signal_breakdown", {}).get("metadata", 0)
    authenticity_score = forensics_result.get("authenticity_score", 50.0)
    
    # Setup scan_result dict matching expected keys in generate_explainable_report
    scan_result = {
        "ela_score": ela_score,
        "metadata_score": metadata_score,
        "scam_similarity": 82.5 if osint_result.get("verdict") == "SCAM" else 15.2,
        "image_path": image_path,
        "authenticity_score": authenticity_score,
        "ai_ensemble": ai_ensemble_result
    }
    
    explainable_report = report_generator.generate_explainable_report(scan_result, lang)
    # Patch the AI results into the output
    explainable_report["ai_ensemble"] = ai_ensemble_result
    
    # ── Explainable AI: CLIP + structured explanation ────────────────────────
    analysis_results = {
        "ela_score": ela_score,
        "metadata_score": metadata_score,
        "clip_analysis": clip_result,
        "ocr_text": extracted_text,
        "osint_matches": osint_result.get("matched_sources", []),
        "osint_verdict": osint_result.get("verdict", "UNVERIFIED"),
        "authenticity_score": authenticity_score,
    }
    explanation_obj = generate_explanation(analysis_results)
    
    # Inject new fields — preserve every existing key
    explainable_report["clip_analysis"] = clip_result
    explainable_report["explanation"] = explanation_obj
    # Ensure confidence is always present and normalised 0-100
    if "confidence" not in explainable_report or explainable_report["confidence"] is None:
        explainable_report["confidence"] = round(max(0, min(100, authenticity_score)), 1)
        
    # ── Misinformation Timeline Reconstruction ───────────────────────────────
    timeline_result = generate_timeline(analysis_results)
    explainable_report["timeline_analysis"] = timeline_result
    
    return explainable_report

# ─────────────────────────────────────────────────────────────────────────────
# 4. POST /analyze/  [rate-limited: 30/minute]
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/analyze/")
@limiter.limit("30/minute")
def analyze(request: Request, body: AnalyzeRequest):
    file_id = body.file_id

    # Forensics
    forensics_result = forensics_engine.analyze_image(file_id)
    authenticity_score: float = forensics_result.get("authenticity_score", 50.0)
    signal = forensics_result.get("signal_breakdown", {})

    # OCR
    image_path = os.path.join(_uploads_dir(), file_id)
    ocr_result = ocr_engine.extract_text(image_path)

    # OSINT
    extracted_text: str = ocr_result.get("extracted_text", "")
    osint_result = osint_agent.verify_claim(extracted_text)
    verdict: str = osint_result.get("verdict", "UNVERIFIED")

    # AI Detection
    ai_detection = ai_image_detector.detect_ai_generated(image_path)

    # Threat category
    if verdict == "FALSE":
        threat_category = "PROPAGANDA"
    elif verdict == "SCAM":
        threat_category = "PHISHING"
    elif authenticity_score < 40:
        threat_category = "MANIPULATED_MEDIA"
    else:
        threat_category = "UNVERIFIED"

    # Risk level
    if authenticity_score < 30:
        risk_level = "CRITICAL"
    elif authenticity_score < 50:
        risk_level = "HIGH"
    elif authenticity_score < 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ── Explainability: reasoning chain ──────────────────────────────────────
    formula_str = forensics_result.get("formula", "0.25×ELA + 0.15×Metadata + 0.30×Noise + 0.30×CopyMove")
    ela_val = signal.get("ela", 0)
    meta_val = signal.get("metadata", 0)
    noise_val = signal.get("noise", 0)
    cm_val = signal.get("copy_move", 0)

    reasoning_steps: list[str] = []

    # Step 1: ELA
    if ela_val < 50:
        reasoning_steps.append(f"ELA detected compression artifacts (score {ela_val:.1f}%) — suggests the image was re-saved or edited.")
    elif ela_val >= 75:
        reasoning_steps.append(f"ELA found no significant compression artifacts (score {ela_val:.1f}%) — consistent with an original image.")
    else:
        reasoning_steps.append(f"ELA returned a moderate score ({ela_val:.1f}%) — inconclusive on compression artifacts.")

    # Step 2: Metadata
    if meta_val < 50:
        reasoning_steps.append(f"Metadata analysis flagged missing or inconsistent EXIF data (score {meta_val:.1f}%).")
    elif meta_val >= 75:
        reasoning_steps.append(f"Metadata is consistent and intact (score {meta_val:.1f}%).")
    else:
        reasoning_steps.append(f"Metadata returned a neutral score ({meta_val:.1f}%) — screenshots often lack EXIF.")

    # Step 3: Noise
    if noise_val < 50:
        reasoning_steps.append(f"Noise analysis detected low variance (score {noise_val:.1f}%) — possible smoothing or AI generation.")
    elif noise_val >= 75:
        reasoning_steps.append(f"Noise pattern appears natural (score {noise_val:.1f}%).")
    else:
        reasoning_steps.append(f"Noise analysis returned a moderate score ({noise_val:.1f}%).")

    # Step 4: Copy-Move
    if cm_val < 70:
        reasoning_steps.append(f"Copy-move detection found suspicious duplicate regions (score {cm_val:.1f}%).")
    else:
        reasoning_steps.append(f"No copy-move manipulation detected (score {cm_val:.1f}%).")

    # Step 5: OSINT
    if verdict == "TRUE":
        reasoning_steps.append(f"OSINT verification: Claim verified as TRUE by trusted sources.")
    elif verdict in ("FALSE", "SCAM"):
        reasoning_steps.append(f"OSINT verification: Claim flagged as {verdict} — contradicted by trusted sources.")
    else:
        reasoning_steps.append(f"OSINT verification: Claim is {verdict} — no matching sources found.")

    # Step 6: AI Detection
    ai_conf = 0
    if isinstance(ai_detection, dict):
        ai_conf = ai_detection.get("confidence", ai_detection.get("ai_confidence", 0))
        ai_label = ai_detection.get("label", ai_detection.get("primary_model", "unknown"))
        reasoning_steps.append(f"AI Image Detector (umm-maybe/AI-image-detector): classified as '{ai_label}' with {ai_conf:.1f}% confidence.")

    # Final verdict explanation
    if authenticity_score >= 70:
        reasoning_steps.append(f"Final Score: {authenticity_score:.1f}% → Verdict: AUTHENTIC (above 70% threshold).")
    elif authenticity_score >= 40:
        reasoning_steps.append(f"Final Score: {authenticity_score:.1f}% → Verdict: SUSPICIOUS (between 40-70% threshold).")
    else:
        reasoning_steps.append(f"Final Score: {authenticity_score:.1f}% → Verdict: FAKE (below 40% threshold).")

    explainability = {
        "models_used": [
            {
                "name": "Forensics Engine (ELA)",
                "description": "Error Level Analysis — detects compression artifacts from image re-saving or editing",
                "weight": "25%",
                "score": round(ela_val, 1),
            },
            {
                "name": "Forensics Engine (Metadata)",
                "description": "EXIF metadata integrity check — verifies camera/software information",
                "weight": "15%",
                "score": round(meta_val, 1),
            },
            {
                "name": "Forensics Engine (Noise)",
                "description": "Noise pattern analysis — AI-generated images have unnaturally smooth noise",
                "weight": "30%",
                "score": round(noise_val, 1),
            },
            {
                "name": "Forensics Engine (Copy-Move)",
                "description": "SIFT-based clone detection — finds duplicated regions within the image",
                "weight": "30%",
                "score": round(cm_val, 1),
            },
            {
                "name": "OSINT Agent",
                "description": "Cross-references extracted text against trusted Indian fact-checkers (AltNews, PIB, BOOM)",
                "weight": "verdict modifier",
                "score": verdict,
            },
            {
                "name": "AI Image Detector (HuggingFace)",
                "description": "umm-maybe/AI-image-detector — deep learning classifier trained to distinguish real vs AI-generated images",
                "weight": "independent signal",
                "score": round(ai_conf, 1) if ai_conf else "N/A",
            },
        ],
        "formula": formula_str,
        "reasoning": reasoning_steps,
    }

    result = {
        "file_id": file_id,
        "authenticity_score": authenticity_score,
        "signal_breakdown": signal,
        "heatmap_url": forensics_result.get("heatmap_url", ""),
        "extracted_text": extracted_text,
        "threat_category": threat_category,
        "risk_level": risk_level,
        "flags": forensics_result.get("flags", []),
        "formula": formula_str,
        "verdict": verdict,
        "matched_sources": osint_result.get("matched_sources", []),
        "explanation": osint_result.get("explanation", ""),
        "fingerprint_match": osint_result.get("fingerprint_match", ""),
        "language_detected": ocr_result.get("language_detected", "en"),
        "ai_detection": ai_detection,
        "explainability": explainability,
    }

    # Persist to DB; file_id doubles as scan_id here
    supabase_client.update_scan_result(file_id, result)

    return result

# ─────────────────────────────────────────────────────────────────────────────
# 4. POST /osint/verify
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/osint/verify")
async def osint_verify(request: OSINTRequest):
    if request.demo_mode and request.demo_mode in DEMO_SCENARIOS:
        return DEMO_SCENARIOS[request.demo_mode]
    return osint_agent.verify_claim(request.claim_text)

# ─────────────────────────────────────────────────────────────────────────────
# 5. POST /report/generate
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/report/generate")
async def generate_report(request: ReportRequest):
    request_data = request.model_dump()
    file_id = request.file_id

    # Generate PDF bytes
    pdf_bytes: bytes = report_generator.generate_pdf_report(request_data)

    # Save PDF locally
    pdf_filename = f"{file_id}_report.pdf"
    pdf_local_path = os.path.join(_outputs_dir(), pdf_filename)
    with open(pdf_local_path, "wb") as f:
        f.write(pdf_bytes)

    # Try Supabase upload; fall back to local path
    try:
        upload_result = supabase_client.upload_file(
            pdf_bytes, pdf_filename, bucket="phantomproof-uploads"
        )
        report_url = upload_result.get("url") or pdf_local_path
    except Exception:
        report_url = pdf_local_path

    # Watermark
    ts = int(time.time())
    raw = f"{file_id}{ts}"
    watermark_id = hashlib.sha256(raw.encode()).hexdigest()[:12]

    content_hash = hashlib.sha256(pdf_bytes).hexdigest()
    supabase_client.save_watermark(
        watermark_id=watermark_id,
        file_id=file_id,
        content_hash=content_hash,
        verdict=request.verdict,
        auth_score=request.authenticity_score,
        timestamp=ts,
    )

    return {"report_url": report_url, "watermark_id": watermark_id}

# ─────────────────────────────────────────────────────────────────────────────
# 6. GET /report/download/{file_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/report/download/{file_id}")
async def download_report(file_id: str):
    pdf_path = os.path.join(_outputs_dir(), f"{file_id}_report.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"Report for '{file_id}' not found.")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"{file_id}_report.pdf",
    )

# ─────────────────────────────────────────────────────────────────────────────
# 7. GET /verify/{watermark_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/verify/{watermark_id}")
async def verify_watermark(watermark_id: str):
    record = supabase_client.get_scan_record(watermark_id)
    if record is None:
        return {"status": "not_found"}
    return record

# ─────────────────────────────────────────────────────────────────────────────
# 8. GET /demo/{scenario_id}  — instant cached demo response
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/demo/{scenario_id}")
async def get_demo(scenario_id: str):
    if scenario_id in DEMO_CACHE:
        return DEMO_CACHE[scenario_id]
    raise HTTPException(status_code=404, detail=f"Demo scenario '{scenario_id}' not found.")
