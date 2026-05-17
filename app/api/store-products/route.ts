import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { getStoreById, isDatabaseConfigured, listStoreProductsFromDb } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const storeId = new URL(request.url).searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ ok: false, message: "Missing storeId" }, { status: 400 });
  }

  const store = await getStoreById(storeId);
  if (!store) {
    return NextResponse.json({ ok: false, message: "Store not found" }, { status: 404 });
  }

  const products = await listStoreProductsFromDb(storeId);
  return NextResponse.json({ ok: true, database: true, products });
}
