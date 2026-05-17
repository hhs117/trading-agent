import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  getStoreById,
  isDatabaseConfigured,
  updateStoreInDb,
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

type Context = {
  params: {
    id: string;
  };
};

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

export async function GET(_request: Request, { params }: Context) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const store = await getStoreById(params.id);
    if (!store) {
      return NextResponse.json({ ok: false, message: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, database: true, store });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as {
      name?: string;
      platform?: string;
      market?: string;
      sellerId?: string | null;
      currency?: string;
      timezone?: string;
      sourceType?: StoreSourceType;
      connectionStatus?: StoreConnectionStatus;
      isActive?: boolean;
      notes?: string | null;
    };

    if (body.sourceType && !SOURCE_TYPES.has(body.sourceType)) {
      return NextResponse.json({ ok: false, message: "Invalid source type" }, { status: 400 });
    }
    if (body.connectionStatus && !CONNECTION_STATUSES.has(body.connectionStatus)) {
      return NextResponse.json({ ok: false, message: "Invalid connection status" }, { status: 400 });
    }

    const store = await updateStoreInDb(params.id, {
      name: body.name?.trim(),
      platform: body.platform?.trim(),
      market: body.market?.trim(),
      sellerId: "sellerId" in body ? body.sellerId?.trim() || null : undefined,
      currency: body.currency?.trim(),
      timezone: body.timezone?.trim(),
      sourceType: body.sourceType,
      connectionStatus: body.connectionStatus,
      isActive: body.isActive,
      notes: "notes" in body ? body.notes?.trim() || null : undefined,
    });
    if (!store) {
      return NextResponse.json({ ok: false, message: "Store not found" }, { status: 404 });
    }

    await writeAuditLogToDb({
      userId: auth.id,
      action: "store.updated",
      entityType: "store",
      entityId: store.id,
      metadata: {
        platform: store.platform,
        market: store.market,
        isActive: store.isActive,
        connectionStatus: store.connectionStatus,
      },
    });
    return NextResponse.json({ ok: true, database: true, store });
  } catch (error) {
    return errorResponse(error);
  }
}
