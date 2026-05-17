import { Pool } from "pg";

import type { MockProduct } from "@/data/mockData";
import type { ScoringRecord } from "@/data/scoring";

export type GenerationKind =
  | "copywriting"
  | "finance"
  | "ai_prompts"
  | "image_review"
  | "customer_reply"
  | "logistics"
  | "security";

export type GenerationRecord<Input = unknown, Result = unknown> = {
  id: string;
  kind: GenerationKind;
  sourceId?: string | null;
  createdAt: string;
  input: Input;
  result: Result;
};

export type StoreSourceType = "manual" | "api" | "csv";
export type StoreConnectionStatus = "unconfigured" | "connected" | "needs_reauth" | "error";

export type StoreRecord = {
  id: string;
  name: string;
  platform: string;
  market: string;
  sellerId: string | null;
  currency: string;
  timezone: string;
  sourceType: StoreSourceType;
  connectionStatus: StoreConnectionStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncEntityType = "product" | "order";
export type SyncSource = "manual" | "api" | "csv";
export type SyncRunStatus = "success" | "partial" | "failed";

export type SyncedStoreProductInput = {
  externalProductId: string;
  externalSku?: string | null;
  title: string;
  status: string;
  price?: number | null;
  currency?: string | null;
  stock?: number | null;
  imageUrl?: string | null;
  raw?: Record<string, unknown>;
};

export type StoreProductRecord = SyncedStoreProductInput & {
  id: string;
  storeId: string;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SyncedOrderInput = {
  externalOrderId: string;
  status: string;
  currency?: string | null;
  totalAmount?: number | null;
  buyerCountry?: string | null;
  placedAt?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  raw?: Record<string, unknown>;
};

export type OrderRecord = SyncedOrderInput & {
  id: string;
  storeId: string;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SyncRunRecord = {
  id: string;
  storeId: string;
  entityType: SyncEntityType;
  source: SyncSource;
  status: SyncRunStatus;
  receivedCount: number;
  upsertedCount: number;
  failedCount: number;
  cursor: string | null;
  metadata: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
};

type DbGenerationRow = {
  id: string;
  kind: GenerationKind;
  source_id: string | null;
  created_at: Date | string;
  input: unknown;
  result: unknown;
};

export type UserRole = "admin" | "operator" | "viewer";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type DbUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
};

type DbSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date | string;
  created_at: Date | string;
  revoked_at: Date | string | null;
};

type DbScoringRow = {
  id: string;
  product_id: string;
  data: ScoringRecord;
  created_at: Date | string;
};

type DbStoreRow = {
  id: string;
  name: string;
  platform: string;
  market: string;
  seller_id: string | null;
  currency: string;
  timezone: string;
  source_type: StoreSourceType;
  connection_status: StoreConnectionStatus;
  is_active: boolean;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbStoreProductRow = {
  id: string;
  store_id: string;
  external_product_id: string;
  external_sku: string | null;
  title: string;
  status: string;
  price: string | number | null;
  currency: string | null;
  stock: number | null;
  image_url: string | null;
  raw: Record<string, unknown>;
  synced_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbOrderRow = {
  id: string;
  store_id: string;
  external_order_id: string;
  status: string;
  currency: string | null;
  total_amount: string | number | null;
  buyer_country: string | null;
  placed_at: Date | string | null;
  paid_at: Date | string | null;
  shipped_at: Date | string | null;
  raw: Record<string, unknown>;
  synced_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbSyncRunRow = {
  id: string;
  store_id: string;
  entity_type: SyncEntityType;
  source: SyncSource;
  status: SyncRunStatus;
  received_count: number;
  upserted_count: number;
  failed_count: number;
  cursor: string | null;
  metadata: Record<string, unknown>;
  started_at: Date | string;
  finished_at: Date | string;
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    pool = new Pool({
      connectionString,
      max: 3,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function createSchema() {
  const db = getPool();
  await db.query(`
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

    ALTER TABLE seapick_users
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

export async function ensureDatabaseSchema() {
  if (!schemaReady) {
    schemaReady = createSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

export async function listProductsFromDb(): Promise<MockProduct[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<{ data: MockProduct }>(
    "SELECT data FROM seapick_products ORDER BY updated_at DESC"
  );
  return result.rows.map((row) => row.data);
}

export async function getProductFromDb(id: string): Promise<MockProduct | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<{ data: MockProduct }>(
    "SELECT data FROM seapick_products WHERE id = $1",
    [id]
  );
  return result.rows[0]?.data ?? null;
}

export async function upsertProductToDb(product: MockProduct): Promise<MockProduct> {
  await ensureDatabaseSchema();
  const now = new Date().toISOString();
  const next: MockProduct = {
    ...product,
    createdAt: product.createdAt || now,
    updatedAt: now,
  };

  const result = await getPool().query<{ data: MockProduct }>(
    `
      INSERT INTO seapick_products (id, data, created_at, updated_at)
      VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, NOW()), NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      RETURNING data
    `,
    [next.id, JSON.stringify(next), next.createdAt]
  );

  return result.rows[0].data;
}

export async function deleteProductFromDb(id: string): Promise<boolean> {
  await ensureDatabaseSchema();
  const result = await getPool().query("DELETE FROM seapick_products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

function normalizeStore(row: DbStoreRow): StoreRecord {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    market: row.market,
    sellerId: row.seller_id,
    currency: row.currency,
    timezone: row.timezone,
    sourceType: row.source_type,
    connectionStatus: row.connection_status,
    isActive: row.is_active,
    notes: row.notes,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
}

export async function listStoresFromDb(): Promise<StoreRecord[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbStoreRow>(
    `
      SELECT id, name, platform, market, seller_id, currency, timezone, source_type,
             connection_status, is_active, notes, created_at, updated_at
      FROM seapick_stores
      ORDER BY created_at ASC
    `
  );
  return result.rows.map(normalizeStore);
}

export async function getStoreById(id: string): Promise<StoreRecord | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbStoreRow>(
    `
      SELECT id, name, platform, market, seller_id, currency, timezone, source_type,
             connection_status, is_active, notes, created_at, updated_at
      FROM seapick_stores
      WHERE id = $1
    `,
    [id]
  );
  return result.rows[0] ? normalizeStore(result.rows[0]) : null;
}

export async function createStoreInDb(input: {
  id?: string;
  name: string;
  platform: string;
  market: string;
  sellerId?: string | null;
  currency: string;
  timezone: string;
  sourceType: StoreSourceType;
  connectionStatus: StoreConnectionStatus;
  notes?: string | null;
}): Promise<StoreRecord> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbStoreRow>(
    `
      INSERT INTO seapick_stores (
        id, name, platform, market, seller_id, currency, timezone,
        source_type, connection_status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, platform, market, seller_id, currency, timezone, source_type,
                connection_status, is_active, notes, created_at, updated_at
    `,
    [
      input.id ?? crypto.randomUUID(),
      input.name,
      input.platform,
      input.market,
      input.sellerId ?? null,
      input.currency,
      input.timezone,
      input.sourceType,
      input.connectionStatus,
      input.notes ?? null,
    ]
  );
  return normalizeStore(result.rows[0]);
}

export async function updateStoreInDb(
  id: string,
  input: Partial<
    Pick<
      StoreRecord,
      | "name"
      | "platform"
      | "market"
      | "sellerId"
      | "currency"
      | "timezone"
      | "sourceType"
      | "connectionStatus"
      | "isActive"
      | "notes"
    >
  >
): Promise<StoreRecord | null> {
  await ensureDatabaseSchema();
  const current = await getStoreById(id);
  if (!current) return null;

  const result = await getPool().query<DbStoreRow>(
    `
      UPDATE seapick_stores
      SET name = $2,
          platform = $3,
          market = $4,
          seller_id = $5,
          currency = $6,
          timezone = $7,
          source_type = $8,
          connection_status = $9,
          is_active = $10,
          notes = $11,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, platform, market, seller_id, currency, timezone, source_type,
                connection_status, is_active, notes, created_at, updated_at
    `,
    [
      id,
      input.name ?? current.name,
      input.platform ?? current.platform,
      input.market ?? current.market,
      input.sellerId === undefined ? current.sellerId : input.sellerId,
      input.currency ?? current.currency,
      input.timezone ?? current.timezone,
      input.sourceType ?? current.sourceType,
      input.connectionStatus ?? current.connectionStatus,
      input.isActive ?? current.isActive,
      input.notes === undefined ? current.notes : input.notes,
    ]
  );
  return result.rows[0] ? normalizeStore(result.rows[0]) : null;
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeStoreProduct(row: DbStoreProductRow): StoreProductRecord {
  return {
    id: row.id,
    storeId: row.store_id,
    externalProductId: row.external_product_id,
    externalSku: row.external_sku,
    title: row.title,
    status: row.status,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    stock: row.stock,
    imageUrl: row.image_url,
    raw: row.raw,
    syncedAt: toIso(row.synced_at)!,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function normalizeOrder(row: DbOrderRow): OrderRecord {
  return {
    id: row.id,
    storeId: row.store_id,
    externalOrderId: row.external_order_id,
    status: row.status,
    currency: row.currency,
    totalAmount: row.total_amount === null ? null : Number(row.total_amount),
    buyerCountry: row.buyer_country,
    placedAt: toIso(row.placed_at),
    paidAt: toIso(row.paid_at),
    shippedAt: toIso(row.shipped_at),
    raw: row.raw,
    syncedAt: toIso(row.synced_at)!,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function normalizeSyncRun(row: DbSyncRunRow): SyncRunRecord {
  return {
    id: row.id,
    storeId: row.store_id,
    entityType: row.entity_type,
    source: row.source,
    status: row.status,
    receivedCount: row.received_count,
    upsertedCount: row.upserted_count,
    failedCount: row.failed_count,
    cursor: row.cursor,
    metadata: row.metadata,
    startedAt: toIso(row.started_at)!,
    finishedAt: toIso(row.finished_at)!,
  };
}

export async function listStoreProductsFromDb(storeId: string): Promise<StoreProductRecord[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbStoreProductRow>(
    `
      SELECT id, store_id, external_product_id, external_sku, title, status, price,
             currency, stock, image_url, raw, synced_at, created_at, updated_at
      FROM seapick_store_products
      WHERE store_id = $1
      ORDER BY updated_at DESC
      LIMIT 500
    `,
    [storeId]
  );
  return result.rows.map(normalizeStoreProduct);
}

export async function upsertStoreProductsToDb(
  storeId: string,
  items: SyncedStoreProductInput[],
  syncedAt: string
): Promise<StoreProductRecord[]> {
  await ensureDatabaseSchema();
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const saved: StoreProductRecord[] = [];
    for (const item of items) {
      const result = await client.query<DbStoreProductRow>(
        `
          INSERT INTO seapick_store_products (
            id, store_id, external_product_id, external_sku, title, status,
            price, currency, stock, image_url, raw, synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::timestamptz)
          ON CONFLICT (store_id, external_product_id)
          DO UPDATE SET
            external_sku = EXCLUDED.external_sku,
            title = EXCLUDED.title,
            status = EXCLUDED.status,
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            stock = EXCLUDED.stock,
            image_url = EXCLUDED.image_url,
            raw = EXCLUDED.raw,
            synced_at = EXCLUDED.synced_at,
            updated_at = NOW()
          RETURNING id, store_id, external_product_id, external_sku, title, status, price,
                    currency, stock, image_url, raw, synced_at, created_at, updated_at
        `,
        [
          crypto.randomUUID(),
          storeId,
          item.externalProductId,
          item.externalSku ?? null,
          item.title,
          item.status,
          item.price ?? null,
          item.currency ?? null,
          item.stock ?? null,
          item.imageUrl ?? null,
          JSON.stringify(item.raw ?? {}),
          syncedAt,
        ]
      );
      saved.push(normalizeStoreProduct(result.rows[0]));
    }
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrdersFromDb(storeId: string): Promise<OrderRecord[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbOrderRow>(
    `
      SELECT id, store_id, external_order_id, status, currency, total_amount, buyer_country,
             placed_at, paid_at, shipped_at, raw, synced_at, created_at, updated_at
      FROM seapick_orders
      WHERE store_id = $1
      ORDER BY placed_at DESC NULLS LAST, updated_at DESC
      LIMIT 500
    `,
    [storeId]
  );
  return result.rows.map(normalizeOrder);
}

export async function upsertOrdersToDb(
  storeId: string,
  items: SyncedOrderInput[],
  syncedAt: string
): Promise<OrderRecord[]> {
  await ensureDatabaseSchema();
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const saved: OrderRecord[] = [];
    for (const item of items) {
      const result = await client.query<DbOrderRow>(
        `
          INSERT INTO seapick_orders (
            id, store_id, external_order_id, status, currency, total_amount, buyer_country,
            placed_at, paid_at, shipped_at, raw, synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, $10::timestamptz, $11::jsonb, $12::timestamptz)
          ON CONFLICT (store_id, external_order_id)
          DO UPDATE SET
            status = EXCLUDED.status,
            currency = EXCLUDED.currency,
            total_amount = EXCLUDED.total_amount,
            buyer_country = EXCLUDED.buyer_country,
            placed_at = EXCLUDED.placed_at,
            paid_at = EXCLUDED.paid_at,
            shipped_at = EXCLUDED.shipped_at,
            raw = EXCLUDED.raw,
            synced_at = EXCLUDED.synced_at,
            updated_at = NOW()
          RETURNING id, store_id, external_order_id, status, currency, total_amount, buyer_country,
                    placed_at, paid_at, shipped_at, raw, synced_at, created_at, updated_at
        `,
        [
          crypto.randomUUID(),
          storeId,
          item.externalOrderId,
          item.status,
          item.currency ?? null,
          item.totalAmount ?? null,
          item.buyerCountry ?? null,
          item.placedAt ?? null,
          item.paidAt ?? null,
          item.shippedAt ?? null,
          JSON.stringify(item.raw ?? {}),
          syncedAt,
        ]
      );
      saved.push(normalizeOrder(result.rows[0]));
    }
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveSyncRunToDb(input: {
  storeId: string;
  entityType: SyncEntityType;
  source: SyncSource;
  status: SyncRunStatus;
  receivedCount: number;
  upsertedCount: number;
  failedCount: number;
  cursor?: string | null;
  metadata?: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
}): Promise<SyncRunRecord> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbSyncRunRow>(
    `
      INSERT INTO seapick_sync_runs (
        id, store_id, entity_type, source, status, received_count, upserted_count,
        failed_count, cursor, metadata, started_at, finished_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::timestamptz, $12::timestamptz)
      RETURNING id, store_id, entity_type, source, status, received_count, upserted_count,
                failed_count, cursor, metadata, started_at, finished_at
    `,
    [
      crypto.randomUUID(),
      input.storeId,
      input.entityType,
      input.source,
      input.status,
      input.receivedCount,
      input.upsertedCount,
      input.failedCount,
      input.cursor ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.startedAt,
      input.finishedAt,
    ]
  );
  return normalizeSyncRun(result.rows[0]);
}

export async function listSyncRunsFromDb(input: {
  storeId?: string;
  entityType?: SyncEntityType;
}): Promise<SyncRunRecord[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbSyncRunRow>(
    `
      SELECT id, store_id, entity_type, source, status, received_count, upserted_count,
             failed_count, cursor, metadata, started_at, finished_at
      FROM seapick_sync_runs
      WHERE ($1::text IS NULL OR store_id = $1)
        AND ($2::text IS NULL OR entity_type = $2)
      ORDER BY finished_at DESC
      LIMIT 100
    `,
    [input.storeId ?? null, input.entityType ?? null]
  );
  return result.rows.map(normalizeSyncRun);
}

function normalizeRecord<Input, Result>(row: DbGenerationRow): GenerationRecord<Input, Result> {
  return {
    id: row.id,
    kind: row.kind,
    sourceId: row.source_id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    input: row.input as Input,
    result: row.result as Result,
  };
}

export async function listGenerationRecordsFromDb<Input, Result>(
  kind: GenerationKind
): Promise<Array<GenerationRecord<Input, Result>>> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbGenerationRow>(
    `
      SELECT id, kind, source_id, input, result, created_at
      FROM seapick_generation_records
      WHERE kind = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [kind]
  );
  return result.rows.map(normalizeRecord<Input, Result>);
}

export async function saveGenerationRecordToDb<Input, Result>(
  record: Omit<GenerationRecord<Input, Result>, "createdAt"> & { createdAt?: string }
): Promise<GenerationRecord<Input, Result>> {
  await ensureDatabaseSchema();

  const id = record.id || crypto.randomUUID();
  const createdAt = record.createdAt || new Date().toISOString();
  const result = await getPool().query<DbGenerationRow>(
    `
      INSERT INTO seapick_generation_records (id, kind, source_id, input, result, created_at)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::timestamptz)
      ON CONFLICT (id)
      DO UPDATE SET
        kind = EXCLUDED.kind,
        source_id = EXCLUDED.source_id,
        input = EXCLUDED.input,
        result = EXCLUDED.result
      RETURNING id, kind, source_id, input, result, created_at
    `,
    [
      id,
      record.kind,
      record.sourceId ?? null,
      JSON.stringify(record.input),
      JSON.stringify(record.result),
      createdAt,
    ]
  );

  return normalizeRecord<Input, Result>(result.rows[0]);
}

export async function deleteGenerationRecordFromDb(id: string): Promise<boolean> {
  await ensureDatabaseSchema();
  const result = await getPool().query("DELETE FROM seapick_generation_records WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function clearGenerationRecordsFromDb(kind: GenerationKind): Promise<number> {
  await ensureDatabaseSchema();
  const result = await getPool().query("DELETE FROM seapick_generation_records WHERE kind = $1", [
    kind,
  ]);
  return result.rowCount ?? 0;
}

function normalizeScoringRecord(row: DbScoringRow): ScoringRecord {
  return {
    ...row.data,
    id: row.id,
    productId: row.product_id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export async function listScoringRecordsFromDb(productId?: string): Promise<ScoringRecord[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbScoringRow>(
    `
      SELECT id, product_id, data, created_at
      FROM seapick_scoring_records
      WHERE ($1::text IS NULL OR product_id = $1)
      ORDER BY created_at DESC
      LIMIT 200
    `,
    [productId ?? null]
  );
  return result.rows.map(normalizeScoringRecord);
}

export async function saveScoringRecordToDb(record: ScoringRecord): Promise<ScoringRecord> {
  await ensureDatabaseSchema();
  const createdAt = record.createdAt || new Date().toISOString();
  const result = await getPool().query<DbScoringRow>(
    `
      INSERT INTO seapick_scoring_records (id, product_id, data, created_at)
      VALUES ($1, $2, $3::jsonb, $4::timestamptz)
      ON CONFLICT (id)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        data = EXCLUDED.data
      RETURNING id, product_id, data, created_at
    `,
    [record.id, record.productId, JSON.stringify(record), createdAt]
  );
  return normalizeScoringRecord(result.rows[0]);
}

export async function deleteScoringRecordFromDb(id: string): Promise<boolean> {
  await ensureDatabaseSchema();
  const result = await getPool().query("DELETE FROM seapick_scoring_records WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

function normalizeUser(row: DbUserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
    lastLoginAt: row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : new Date(row.last_login_at).toISOString()
      : null,
  };
}

export async function countUsers(): Promise<number> {
  await ensureDatabaseSchema();
  const result = await getPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM seapick_users");
  return Number(result.rows[0]?.count ?? 0);
}

export async function listUsersFromDb(): Promise<AppUser[]> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow>(
    `
      SELECT id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at, last_login_at
      FROM seapick_users
      ORDER BY created_at ASC
    `
  );
  return result.rows.map(normalizeUser);
}

export async function getUserByEmail(email: string): Promise<(AppUser & { passwordHash: string }) | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow>(
    `
      SELECT id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at, last_login_at
      FROM seapick_users
      WHERE lower(email) = lower($1)
    `,
    [email]
  );
  const row = result.rows[0];
  return row ? { ...normalizeUser(row), passwordHash: row.password_hash } : null;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow>(
    `
      SELECT id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at, last_login_at
      FROM seapick_users
      WHERE id = $1
    `,
    [id]
  );
  return result.rows[0] ? normalizeUser(result.rows[0]) : null;
}

export async function createUserInDb(input: {
  id?: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  mustChangePassword?: boolean;
}): Promise<AppUser> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow>(
    `
      INSERT INTO seapick_users (id, email, name, password_hash, role, must_change_password)
      VALUES ($1, lower($2), $3, $4, $5, $6)
      RETURNING id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at, last_login_at
    `,
    [
      input.id ?? crypto.randomUUID(),
      input.email,
      input.name,
      input.passwordHash,
      input.role,
      input.mustChangePassword ?? false,
    ]
  );
  return normalizeUser(result.rows[0]);
}

export async function updateUserPasswordInDb(
  id: string,
  passwordHash: string,
  mustChangePassword = false
): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    `
      UPDATE seapick_users
      SET password_hash = $2,
          must_change_password = $3,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, passwordHash, mustChangePassword]
  );
}

export async function updateUserInDb(
  id: string,
  input: Partial<Pick<AppUser, "name" | "role" | "isActive" | "mustChangePassword">>
): Promise<AppUser | null> {
  await ensureDatabaseSchema();
  const current = await getUserById(id);
  if (!current) return null;

  const result = await getPool().query<DbUserRow>(
    `
      UPDATE seapick_users
      SET name = $2,
          role = $3,
          is_active = $4,
          must_change_password = $5,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, password_hash, role, is_active, must_change_password, created_at, updated_at, last_login_at
    `,
    [
      id,
      input.name ?? current.name,
      input.role ?? current.role,
      input.isActive ?? current.isActive,
      input.mustChangePassword ?? current.mustChangePassword,
    ]
  );

  return result.rows[0] ? normalizeUser(result.rows[0]) : null;
}

export async function markUserLoginInDb(id: string): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query("UPDATE seapick_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [
    id,
  ]);
}

export async function createSessionInDb(input: {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    `
      INSERT INTO seapick_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4::timestamptz)
    `,
    [input.id ?? crypto.randomUUID(), input.userId, input.tokenHash, input.expiresAt]
  );
}

export async function getSessionUserByTokenHash(tokenHash: string): Promise<AppUser | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow & DbSessionRow>(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.password_hash,
        u.role,
        u.is_active,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        s.id AS session_id,
        s.user_id,
        s.token_hash,
        s.expires_at,
        s.created_at AS session_created_at,
        s.revoked_at
      FROM seapick_sessions s
      JOIN seapick_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
    `,
    [tokenHash]
  );
  return result.rows[0] ? normalizeUser(result.rows[0]) : null;
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    "UPDATE seapick_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash]
  );
}

export async function revokeSessionsForUserInDb(userId: string): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    "UPDATE seapick_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
}

export async function getUserStateFromDb<T>(userId: string, stateKey: string): Promise<T | null> {
  await ensureDatabaseSchema();
  const result = await getPool().query<{ value: T }>(
    `
      SELECT value
      FROM seapick_user_state
      WHERE user_id = $1 AND state_key = $2
    `,
    [userId, stateKey]
  );
  return result.rows[0]?.value ?? null;
}

export async function saveUserStateToDb<T>(userId: string, stateKey: string, value: T): Promise<T> {
  await ensureDatabaseSchema();
  const result = await getPool().query<{ value: T }>(
    `
      INSERT INTO seapick_user_state (user_id, state_key, value, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (user_id, state_key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING value
    `,
    [userId, stateKey, JSON.stringify(value)]
  );
  return result.rows[0].value;
}

export async function writeAuditLogToDb(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    `
      INSERT INTO seapick_audit_logs (id, user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      crypto.randomUUID(),
      input.userId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}
