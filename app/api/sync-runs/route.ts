import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import {
  isDatabaseConfigured,
  listSyncRunsFromDb,
  type SyncEntityType,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ENTITY_TYPES = new Set<SyncEntityType>(["product", "order"]);

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  if (entityType && !ENTITY_TYPES.has(entityType as SyncEntityType)) {
    return NextResponse.json({ ok: false, message: "Invalid entityType" }, { status: 400 });
  }

  const runs = await listSyncRunsFromDb({
    storeId: searchParams.get("storeId") ?? undefined,
    entityType: (entityType as SyncEntityType | null) ?? undefined,
  });
  return NextResponse.json({ ok: true, database: true, runs });
}
