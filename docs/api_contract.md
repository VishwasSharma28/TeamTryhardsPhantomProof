# PHANTOMPROOF API Contract
## All teammates build against these signatures

POST /upload/
  Body: multipart/form-data { file }
  Returns: { file_id: string, url: string, filename: string }

POST /analyze/
  Body: { file_id: string }
  Returns: {
    file_id, authenticity_score, signal_breakdown: {ela, metadata, noise, copy_move},
    heatmap_url, extracted_text, threat_category, risk_level, flags[], formula
  }

POST /osint/verify
  Body: { claim_text: string, demo_mode?: string }
  Returns: { verdict, matched_sources[], explanation, fingerprint_match }

POST /report/generate
  Body: { file_id, authenticity_score, threat_category, risk_level,
          extracted_text, verdict, matched_sources[], flags[] }
  Returns: { report_url }

GET /report/download/{file_id}
  Returns: PDF file stream

GET /verify/{watermark_id}
  Returns: { watermark_id, verdict, auth_score, content_hash, timestamp }

GET /health
  Returns: { status: "ok", timestamp }