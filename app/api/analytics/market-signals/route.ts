import { NextResponse } from "next/server";

import type { PlatformName } from "@/data/phase5";
import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { getMarketIntelHealth, getPlatformMarketIntel } from "@/lib/server/market-intel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLATFORMS: PlatformName[] = ["Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"];

function isPlatform(value: string | null): value is PlatformName {
  return PLATFORMS.includes(value as PlatformName);
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim();
  if (!category) {
    return NextResponse.json({ ok: false, message: "category 参数必填" }, { status: 400 });
  }
  const country = searchParams.get("country")?.trim() || null;
  const keyword = searchParams.get("keyword")?.trim() || null;
  const platformParam = searchParams.get("platform");
  const platforms: PlatformName[] = isPlatform(platformParam) ? [platformParam] : PLATFORMS;

  const results = await Promise.all(
    platforms.map((platform) =>
      getPlatformMarketIntel({ platform, category, country, keyword }).catch((error) => ({
        platform,
        category,
        country,
        primary: null,
        trends: null,
        warnings: [error instanceof Error ? error.message : "市场信号聚合失败"],
      }))
    )
  );

  return NextResponse.json({
    ok: true,
    category,
    country,
    keyword,
    platforms: results,
    providers: getMarketIntelHealth(),
  });
}
