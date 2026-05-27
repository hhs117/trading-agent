import { NextResponse } from "next/server";

import type { PlatformName } from "@/data/phase5";
import { MOCK_CATEGORIES, MOCK_STATUS_OPTIONS, type MockProduct } from "@/data/mockData";
import { isAuthResponse, requireUser } from "@/lib/server/auth";
import {
  isDatabaseConfigured,
  upsertProductToDb,
  writeAuditLogToDb,
} from "@/lib/server/database";
import { searchProducts } from "@/lib/server/product-search";
import type { CompetitorItem } from "@/data/phase5";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLATFORM_NAMES = new Set<PlatformName>(["Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"]);

function parsePlatform(value: string | null): PlatformName | "" {
  return value && PLATFORM_NAMES.has(value as PlatformName) ? (value as PlatformName) : "";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(Math.trunc(parsed), 100));
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const result = await searchProducts({
    keyword: searchParams.get("keyword")?.trim() ?? "",
    platform: parsePlatform(searchParams.get("platform")),
    limit: parseLimit(searchParams.get("limit")),
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, database: false, message: "DATABASE_URL is not configured" },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { item?: CompetitorItem };
  if (!body.item?.id || !body.item.name || !body.item.platform) {
    return NextResponse.json({ ok: false, message: "Invalid search item payload" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const product = searchItemToProduct(body.item, now);
  const saved = await upsertProductToDb(product);
  await writeAuditLogToDb({
    userId: auth.id,
    action: "product.promoted_from_search",
    entityType: "product",
    entityId: saved.id,
    metadata: {
      source: body.item.source ?? "search",
      externalId: body.item.externalId ?? null,
      detailUrl: body.item.detailUrl ?? null,
    },
  });

  return NextResponse.json({ ok: true, database: true, product: saved }, { status: 201 });
}

function searchItemToProduct(item: CompetitorItem, now: string): MockProduct {
  const salePrice = item.price ?? 0;
  const costPrice = salePrice > 0 ? Number((salePrice * 0.38).toFixed(2)) : 1;
  return {
    id: `src-${item.id}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80),
    name: item.name,
    category: inferCategory(item),
    platform: "Shopee",
    image: item.imageUrl ?? "",
    costPrice,
    salePrice,
    shippingCost: salePrice > 0 ? Number((salePrice * 0.08).toFixed(2)) : 0,
    commissionRate: 0.08,
    monthlySales: item.monthlySales ?? 0,
    rating: item.rating ?? 0,
    reviewCount: item.reviewCount ?? 0,
    supplier: item.platform,
    targetMarket: ["TH"],
    status: MOCK_STATUS_OPTIONS[0],
    createdAt: now,
    updatedAt: now,
    supplierUrl: item.detailUrl ?? undefined,
    stock: 100,
    notes: [
      `Source platform: ${item.platform}`,
      `Source item: ${item.id}`,
      item.recommendationIndex === null ? "" : `Recommendation index: ${item.recommendationIndex}/10`,
      item.estimatedProfitRate === null ? "" : `Estimated profit rate: ${item.estimatedProfitRate}%`,
      item.sellingPoints.length ? `Selling points: ${item.sellingPoints.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function inferCategory(item: CompetitorItem): string {
  const text = [item.name, ...item.keywords, ...item.sellingPoints].join(" ").toLowerCase();
  if (/pet|cat|dog|feeder/.test(text)) return "宠物用品";
  if (/kitchen|peeler|cup|bottle|tumbler/.test(text)) return "厨房用品";
  if (/travel|packing|organizer|storage|home/.test(text)) return "家居生活";
  if (/mask|beauty|silk|sleep/.test(text)) return "美妆个护";
  if (/mouse|usb|wireless|phone|charger/.test(text)) return "数码电子";
  if (/camping|outdoor|lantern/.test(text)) return "运动户外";
  return MOCK_CATEGORIES[0];
}
