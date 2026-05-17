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

CREATE TABLE IF NOT EXISTS seapick_stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  market TEXT NOT NULL,
  seller_id TEXT,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'api', 'csv')),
  connection_status TEXT NOT NULL CHECK (connection_status IN ('unconfigured', 'connected', 'needs_reauth', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_stores_platform_market_idx
  ON seapick_stores (platform, market);

CREATE TABLE IF NOT EXISTS seapick_scoring_records (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_scoring_product_created_idx
  ON seapick_scoring_records (product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seapick_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS seapick_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES seapick_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS seapick_sessions_user_idx
  ON seapick_sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS seapick_user_state (
  user_id TEXT NOT NULL REFERENCES seapick_users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, state_key)
);

CREATE TABLE IF NOT EXISTS seapick_audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES seapick_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_audit_logs_created_idx
  ON seapick_audit_logs (created_at DESC);
