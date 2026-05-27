import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import { buildShopeeAuthUrl, getShopeeIntegrationStatus } from "@/lib/server/shopee";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const status = getShopeeIntegrationStatus();
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, message: "Shopee credentials are not configured", shopee: status },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  return NextResponse.json({ ok: true, url: buildShopeeAuthUrl(state), state });
}
