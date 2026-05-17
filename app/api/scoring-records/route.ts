import { NextResponse } from "next/server";

import type { ScoringRecord } from "@/data/scoring";
import { isAuthResponse, requireUser } from "@/lib/server/auth";
import {
  deleteScoringRecordFromDb,
  isDatabaseConfigured,
  listScoringRecordsFromDb,
  saveScoringRecordToDb,
  writeAuditLogToDb,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  const productId = new URL(request.url).searchParams.get("productId") ?? undefined;

  try {
    const records = await listScoringRecordsFromDb(productId);
    return NextResponse.json({ ok: true, database: true, records });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const record = (await request.json()) as ScoringRecord;
    if (!record?.id || !record.productId || !record.productName || !record.scores) {
      return NextResponse.json({ ok: false, message: "Invalid scoring record" }, { status: 400 });
    }

    const saved = await saveScoringRecordToDb(record);
    await writeAuditLogToDb({
      userId: auth.id,
      action: "scoring_record.saved",
      entityType: "scoring_record",
      entityId: saved.id,
      metadata: { productId: saved.productId },
    });
    return NextResponse.json({ ok: true, database: true, record: saved }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
  }

  try {
    const deleted = await deleteScoringRecordFromDb(id);
    if (deleted) {
      await writeAuditLogToDb({
        userId: auth.id,
        action: "scoring_record.deleted",
        entityType: "scoring_record",
        entityId: id,
      });
    }
    return NextResponse.json({ ok: true, database: true, deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
