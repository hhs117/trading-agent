import { NextResponse } from "next/server";

import { MAX_COMPARE_COUNT } from "@/data/phase5";
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

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, MAX_COMPARE_COUNT);
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
    const ids = (await getUserStateFromDb<string[]>(auth.id, STATE_KEY)) ?? [];
    return NextResponse.json({ ok: true, database: true, ids: sanitizeIds(ids) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = sanitizeIds(body.ids);
    const saved = await saveUserStateToDb(auth.id, STATE_KEY, ids);
    await writeAuditLogToDb({
      userId: auth.id,
      action: "compare_items.saved",
      entityType: "user_state",
      entityId: STATE_KEY,
      metadata: { count: ids.length },
    });
    return NextResponse.json({ ok: true, database: true, ids: sanitizeIds(saved) });
  } catch (error) {
    return errorResponse(error);
  }
}
