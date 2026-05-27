import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import {
  getProductFromDb,
  getStoreById,
  isDatabaseConfigured,
} from "@/lib/server/database";
import {
  mapProductToTikTokShopDraft,
  validateTikTokShopListingDraft,
  type TikTokShopListingDraft,
  type TikTokShopRegion,
} from "@/lib/server/tiktok-shop";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  const body = (await request.json()) as {
    productId?: string;
    storeId?: string;
    region?: TikTokShopRegion;
    draft?: TikTokShopListingDraft;
  };

  let draft = body.draft;
  if (!draft && body.productId) {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { ok: false, message: "DATABASE_URL is not configured" },
        { status: 400 }
      );
    }
    const product = await getProductFromDb(body.productId);
    if (!product) {
      return NextResponse.json({ ok: false, message: "Product not found" }, { status: 404 });
    }
    const store = body.storeId ? await getStoreById(body.storeId) : null;
    draft = mapProductToTikTokShopDraft({ product, store, region: body.region });
  }

  if (!draft) {
    return NextResponse.json({ ok: false, message: "Missing listing draft" }, { status: 400 });
  }

  const issues = validateTikTokShopListingDraft(draft);
  return NextResponse.json({
    ok: true,
    draft,
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  });
}
