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

CREATE TABLE IF NOT EXISTS seapick_store_auth_tokens (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES seapick_stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_shop_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_store_auth_tokens_store_platform_idx
  ON seapick_store_auth_tokens (store_id, platform);

CREATE TABLE IF NOT EXISTS seapick_store_products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES seapick_stores(id) ON DELETE CASCADE,
  external_product_id TEXT NOT NULL,
  external_sku TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  price NUMERIC,
  currency TEXT,
  stock INTEGER,
  image_url TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, external_product_id)
);

CREATE INDEX IF NOT EXISTS seapick_store_products_store_updated_idx
  ON seapick_store_products (store_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS seapick_orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES seapick_stores(id) ON DELETE CASCADE,
  external_order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT,
  total_amount NUMERIC,
  buyer_country TEXT,
  placed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, external_order_id)
);

CREATE INDEX IF NOT EXISTS seapick_orders_store_placed_idx
  ON seapick_orders (store_id, placed_at DESC);

CREATE TABLE IF NOT EXISTS seapick_sync_runs (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES seapick_stores(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'order')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'api', 'csv')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  received_count INTEGER NOT NULL DEFAULT 0,
  upserted_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  cursor TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS seapick_sync_runs_store_created_idx
  ON seapick_sync_runs (store_id, finished_at DESC);

CREATE TABLE IF NOT EXISTS seapick_listing_publish_jobs (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES seapick_stores(id) ON DELETE SET NULL,
  product_id TEXT,
  platform TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'validated', 'dry_run', 'publishing', 'published', 'failed')),
  draft JSONB NOT NULL,
  validation_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_product_id TEXT,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seapick_listing_publish_jobs_store_updated_idx
  ON seapick_listing_publish_jobs (store_id, updated_at DESC);

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

CREATE TABLE IF NOT EXISTS seapick_platform_market_signals (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT,
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, category, country, provider)
);

CREATE INDEX IF NOT EXISTS seapick_platform_market_signals_lookup_idx
  ON seapick_platform_market_signals (platform, category, country);
