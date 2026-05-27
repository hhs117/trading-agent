import { payloadToSignal, readCachedSignal, writeCachedSignal } from "./cache";
import type {
  MarketIntelAdapter,
  MarketIntelQuery,
  MarketIntelSignal,
  TopProductSignal,
} from "./types";

const PROVIDER = "fastmoss" as const;
const CACHE_TTL_MIN = 360;

/**
 * FastMoss adapter (TikTok Shop). 真实接口字段需要拿到商务发的 API 文档后再细化，
 * 当前实现：未配置 FASTMOSS_API_KEY 时返回 unconfigured；配置后请求 FASTMOSS_API_BASE_URL，
 * 字段映射用宽松兜底，等正式文档到位替换 normalizeFastMossPayload 即可。
 */

type LooseRecord = Record<string, unknown>;

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function normalizeProduct(raw: LooseRecord): TopProductSignal | null {
  const id = pickString(raw.product_id, raw.id, raw.item_id);
  const title = pickString(raw.title, raw.product_name, raw.name);
  if (!id || !title) return null;
  return {
    externalId: id,
    title,
    price: pickNumber(raw.price, raw.avg_price),
    monthlySales: pickNumber(raw.sales_30d, raw.monthly_sales, raw.sold_count),
    rating: pickNumber(raw.rating, raw.score),
    reviewCount: pickNumber(raw.review_count, raw.comments),
    imageUrl: pickString(raw.image, raw.cover, raw.image_url),
    detailUrl: pickString(raw.detail_url, raw.url),
  };
}

function normalizeFastMossPayload(json: unknown): Partial<MarketIntelSignal> {
  if (!json || typeof json !== "object") return {};
  const root = json as LooseRecord;
  const data = (root.data ?? root.result ?? root) as LooseRecord;

  const list = Array.isArray(data.products)
    ? (data.products as LooseRecord[])
    : Array.isArray(data.list)
      ? (data.list as LooseRecord[])
      : Array.isArray(data.items)
        ? (data.items as LooseRecord[])
        : [];

  const topProducts = list
    .map(normalizeProduct)
    .filter((item): item is TopProductSignal => Boolean(item))
    .slice(0, 10);

  return {
    averagePrice: pickNumber(data.average_price, data.avg_price),
    competitorCount: pickNumber(data.shop_count, data.seller_count, data.competitor_count),
    estimatedSales: pickNumber(data.total_sales, data.sales_30d, data.monthly_sales),
    trendYoy: pickNumber(data.growth_rate, data.yoy, data.trend_yoy),
    topProducts,
    hotKeywords: Array.isArray(data.keywords)
      ? (data.keywords as unknown[])
          .filter((value): value is string => typeof value === "string")
          .slice(0, 10)
      : undefined,
  };
}

export const fastmossAdapter: MarketIntelAdapter = {
  provider: PROVIDER,

  supports(platform) {
    return platform === "TikTok Shop";
  },

  isConfigured() {
    return Boolean(process.env.FASTMOSS_API_KEY && process.env.FASTMOSS_API_BASE_URL);
  },

  async fetch(query: MarketIntelQuery): Promise<MarketIntelSignal> {
    const fetchedAt = new Date().toISOString();
    const country = query.country ?? null;
    const base = {
      platform: query.platform,
      category: query.category,
      country,
      provider: PROVIDER,
      fetchedAt,
      cached: false,
    };

    if (!this.isConfigured()) {
      return {
        ...base,
        status: "unconfigured",
        message:
          "FastMoss API 未配置。需要在 fastmoss.com 购买套餐并联系商务拿 API Key，把 FASTMOSS_API_KEY 和 FASTMOSS_API_BASE_URL 填到 .env。",
      };
    }

    const cached = await readCachedSignal({
      platform: query.platform,
      category: query.category,
      country,
      provider: PROVIDER,
    });
    if (cached) return payloadToSignal(cached);

    const apiBase = process.env.FASTMOSS_API_BASE_URL!.replace(/\/+$/, "");
    const url = new URL(`${apiBase}/v1/product/category`);
    url.searchParams.set("category", query.category);
    if (country) url.searchParams.set("region", country);
    if (query.keyword) url.searchParams.set("keyword", query.keyword);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.FASTMOSS_API_KEY}`,
          "x-api-key": process.env.FASTMOSS_API_KEY!,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return { ...base, status: "error", message: `FastMoss API ${response.status}` };
      }

      const json = (await response.json()) as unknown;
      const normalized = normalizeFastMossPayload(json);

      const signal: MarketIntelSignal = {
        ...base,
        status: "ok",
        ...normalized,
      };

      await writeCachedSignal(
        { platform: query.platform, category: query.category, country, provider: PROVIDER },
        signal,
        CACHE_TTL_MIN
      );

      return signal;
    } catch (error) {
      return {
        ...base,
        status: "error",
        message: error instanceof Error ? error.message : "FastMoss API 调用异常",
      };
    }
  },
};
