import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { getShopeeIntegrationStatus } from "@/lib/server/shopee";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  return NextResponse.json({
    ok: true,
    shopee: getShopeeIntegrationStatus(),
  });
}
