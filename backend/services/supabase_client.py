import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")

# Lazy client — only created when first needed so server starts without credentials
_supabase_client: Client | None = None

def _client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def upload_file(file_bytes: bytes, filename: str, bucket: str = "phantomproof-uploads") -> dict:
    try:
        _client().storage.from_(bucket).upload(
            path=filename,
            file=file_bytes,
            file_options={"upsert": "true"},
        )
        public_url = _client().storage.from_(bucket).get_public_url(filename)
        return {"file_id": filename, "url": public_url, "filename": filename}
    except Exception as e:
        print(f"[supabase_client] upload_file error: {e}")
        return {"file_id": filename, "url": "", "filename": filename}


def save_file_locally(file_bytes: bytes, filename: str) -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    uploads_dir = os.path.join(repo_root, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_path


def create_scan_record(file_id: str, filename: str, url: str) -> str:
    try:
        response = (
            _client().table("scans")
            .insert({"file_id": file_id, "status": "pending"})
            .execute()
        )
        row = response.data[0]
        return row["id"]
    except Exception as e:
        print(f"[supabase_client] create_scan_record error: {e}")
        return ""


def update_scan_result(scan_id: str, results: dict) -> bool:
    try:
        _client().table("scans").update(
            {"results": results, "status": "complete"}
        ).eq("id", scan_id).execute()
        return True
    except Exception as e:
        print(f"[supabase_client] update_scan_result error: {e}")
        return False


def get_scan_record(scan_id: str) -> dict | None:
    try:
        response = (
            _client().table("scans")
            .select("*")
            .eq("id", scan_id)
            .single()
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"[supabase_client] get_scan_record error: {e}")
        return None


def save_watermark(
    watermark_id: str,
    file_id: str,
    content_hash: str,
    verdict: str,
    auth_score: float,
    timestamp: int,
) -> bool:
    try:
        _client().table("watermarks").insert(
            {
                "id": watermark_id,
                "file_id": file_id,
                "content_hash": content_hash,
                "verdict": verdict,
                "auth_score": auth_score,
                "timestamp": timestamp,
            }
        ).execute()
        return True
    except Exception as e:
        print(f"[supabase_client] save_watermark error: {e}")
        return False