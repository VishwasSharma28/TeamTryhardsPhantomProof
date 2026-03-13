import os
import time
from dotenv import load_dotenv

load_dotenv()

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from limiter import limiter
from routers.scan_routes import router

app = FastAPI(
    title="PHANTOMPROOF.ai API",
    version="1.0.0",
    description="Image forensics, OSINT verification, and report generation for PHANTOMPROOF.ai",
)

# ── Rate limiter ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 1)
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime())
    print(
        f"[{timestamp}] {request.method} {request.url.path}"
        f" → {response.status_code} ({duration_ms}ms)"
    )
    return response

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "status": 500},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(router, prefix="")

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("FASTAPI_PORT", 8000)),
        reload=True,
    )
