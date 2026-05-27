import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  buildTikTokShopAuthUrl,
  getTikTokShopIntegrationStatus,
} from "@/lib/server/tiktok-shop";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const status = getTikTokShopIntegrationStatus();
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, message: "TikTok Shop credentials are not configured", tiktokShop: status },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  return NextResponse.json({ ok: true, url: buildTikTokShopAuthUrl(state), state });
}
