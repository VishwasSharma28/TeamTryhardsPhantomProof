CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watermarks (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  verdict TEXT NOT NULL,
  auth_score FLOAT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);