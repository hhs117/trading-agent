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
      SELECT id, email, name, password_hash, role, is_active, created_at, updated_at, last_login_at
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
      SELECT id, email, name, password_hash, role, is_active, created_at, updated_at, last_login_at
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
      SELECT id, email, name, password_hash, role, is_active, created_at, updated_at, last_login_at
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
}): Promise<AppUser> {
  await ensureDatabaseSchema();
  const result = await getPool().query<DbUserRow>(
    `
      INSERT INTO seapick_users (id, email, name, password_hash, role)
      VALUES ($1, lower($2), $3, $4, $5)
      RETURNING id, email, name, password_hash, role, is_active, created_at, updated_at, last_login_at
    `,
    [input.id ?? crypto.randomUUID(), input.email, input.name, input.passwordHash, input.role]
  );
  return normalizeUser(result.rows[0]);
}

export async function updateUserPasswordInDb(id: string, passwordHash: string): Promise<void> {
  await ensureDatabaseSchema();
  await getPool().query(
    "UPDATE seapick_users SET password_hash = $2, updated_at = NOW() WHERE id = $1",
    [id, passwordHash]
  );
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
