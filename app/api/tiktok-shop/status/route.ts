import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { getTikTokShopIntegrationStatus } from "@/lib/server/tiktok-shop";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  return NextResponse.json({
    ok: true,
    tiktokShop: getTikTokShopIntegrationStatus(),
  });
}
