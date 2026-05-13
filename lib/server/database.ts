import { Pool } from "pg";

import type { MockProduct } from "@/data/mockData";

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
