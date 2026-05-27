import { NextResponse } from "next/server";

import { MAX_COMPARE_COUNT, normalizeCompareItems, type CompetitorItem } from "@/data/phase5";
import { isAuthResponse, requireUser } from "@/lib/server/auth";
import {
  getUserStateFromDb,
  isDatabaseConfigured,
  saveUserStateToDb,
  writeAuditLogToDb,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_KEY = "phase5.compareCompetitors";

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function sanitizeItems(value: unknown): CompetitorItem[] {
  return normalizeCompareItems(value).slice(0, MAX_COMPARE_COUNT);
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const value = await getUserStateFromDb<unknown>(auth.id, STATE_KEY);
    const items = sanitizeItems(value);
    return NextResponse.json({ ok: true, database: true, items, ids: items.map((item) => item.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as { items?: unknown; ids?: unknown };
    const items = sanitizeItems(body.items ?? body.ids);
    const saved = sanitizeItems(await saveUserStateToDb(auth.id, STATE_KEY, items));
    await writeAuditLogToDb({
      userId: auth.id,
      action: "compare_items.saved",
      entityType: "user_state",
      entityId: STATE_KEY,
      metadata: { count: saved.length },
    });
    return NextResponse.json({ ok: true, database: true, items: saved, ids: saved.map((item) => item.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
