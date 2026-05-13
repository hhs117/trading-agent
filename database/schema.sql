CREATE TABLE IF NOT EXISTS seapick_products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seapick_generation_records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  source_id TEXT,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_generation_kind_created_idx
  ON seapick_generation_records (kind, created_at DESC);
