import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  getStoreById,
  isDatabaseConfigured,
  saveSyncRunToDb,
  upsertStoreProductsToDb,
  writeAuditLogToDb,
  type SyncSource,
  type SyncedStoreProductInput,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SOURCES = new Set<SyncSource>(["manual", "api", "csv"]);

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown sync error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

async function requireOperator() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin", "operator"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return auth;
}

function normalizeItems(value: unknown): SyncedStoreProductInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item as Partial<SyncedStoreProductInput>)
    .filter((item) => item.externalProductId?.trim() && item.title?.trim() && item.status?.trim())
    .map((item) => ({
      externalProductId: item.externalProductId!.trim(),
      externalSku: item.externalSku?.trim() || null,
      title: item.title!.trim(),
      status: item.status!.trim(),
      price: typeof item.price === "number" ? item.price : null,
      currency: item.currency?.trim() || null,
      stock: typeof item.stock === "number" ? Math.trunc(item.stock) : null,
      imageUrl: item.imageUrl?.trim() || null,
      raw: item.raw ?? {},
    }));
}

export async function POST(request: Request) {
  const auth = await requireOperator();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const startedAt = new Date().toISOString();
    const body = (await request.json()) as {
      storeId?: string;
      source?: SyncSource;
      cursor?: string | null;
      items?: unknown;
      metadata?: Record<string, unknown>;
    };
    const source = body.source ?? "manual";
    const items = normalizeItems(body.items);

    if (!body.storeId || !SOURCES.has(source) || !Array.isArray(body.items)) {
      return NextResponse.json({ ok: false, message: "Invalid sync payload" }, { status: 400 });
    }

    const store = await getStoreById(body.storeId);
    if (!store) {
      return NextResponse.json({ ok: false, message: "Store not found" }, { status: 404 });
    }

    const saved = await upsertStoreProductsToDb(body.storeId, items, startedAt);
    const finishedAt = new Date().toISOString();
    const failedCount = Math.max(0, Array.isArray(body.items) ? body.items.length - items.length : 0);
    const run = await saveSyncRunToDb({
      storeId: body.storeId,
      entityType: "product",
      source,
      status: failedCount > 0 ? "partial" : "success",
      receivedCount: Array.isArray(body.items) ? body.items.length : 0,
      upsertedCount: saved.length,
      failedCount,
      cursor: body.cursor ?? null,
      metadata: body.metadata,
      startedAt,
      finishedAt,
    });
    await writeAuditLogToDb({
      userId: auth.id,
      action: "sync.products.completed",
      entityType: "sync_run",
      entityId: run.id,
      metadata: { storeId: body.storeId, receivedCount: run.receivedCount, upsertedCount: run.upsertedCount },
    });
    return NextResponse.json({ ok: true, database: true, products: saved, run }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
