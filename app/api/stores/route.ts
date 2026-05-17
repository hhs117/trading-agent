import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  createStoreInDb,
  isDatabaseConfigured,
  listStoresFromDb,
  writeAuditLogToDb,
  type StoreConnectionStatus,
  type StoreSourceType,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SOURCE_TYPES = new Set<StoreSourceType>(["manual", "api", "csv"]);
const CONNECTION_STATUSES = new Set<StoreConnectionStatus>([
  "unconfigured",
  "connected",
  "needs_reauth",
  "error",
]);

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

async function requireAdmin() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const stores = await listStoresFromDb();
    return NextResponse.json({ ok: true, database: true, stores });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as {
      name?: string;
      platform?: string;
      market?: string;
      sellerId?: string;
      currency?: string;
      timezone?: string;
      sourceType?: StoreSourceType;
      connectionStatus?: StoreConnectionStatus;
      notes?: string;
    };

    const name = body.name?.trim();
    const platform = body.platform?.trim();
    const market = body.market?.trim();
    const currency = body.currency?.trim();
    const timezone = body.timezone?.trim();
    const sourceType = body.sourceType ?? "manual";
    const connectionStatus = body.connectionStatus ?? "unconfigured";

    if (
      !name ||
      !platform ||
      !market ||
      !currency ||
      !timezone ||
      !SOURCE_TYPES.has(sourceType) ||
      !CONNECTION_STATUSES.has(connectionStatus)
    ) {
      return NextResponse.json({ ok: false, message: "Invalid store payload" }, { status: 400 });
    }

    const store = await createStoreInDb({
      name,
      platform,
      market,
      sellerId: body.sellerId?.trim() || null,
      currency,
      timezone,
      sourceType,
      connectionStatus,
      notes: body.notes?.trim() || null,
    });
    await writeAuditLogToDb({
      userId: auth.id,
      action: "store.created",
      entityType: "store",
      entityId: store.id,
      metadata: { platform: store.platform, market: store.market },
    });
    return NextResponse.json({ ok: true, database: true, store }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
