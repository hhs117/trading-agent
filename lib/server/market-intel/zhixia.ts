import { payloadToSignal, readCachedSignal, writeCachedSignal } from "./cache";
import type {
  MarketIntelAdapter,
  MarketIntelQuery,
  MarketIntelSignal,
  TopProductSignal,
} from "./types";

const PROVIDER = "zhixia" as const;
const CACHE_TTL_MIN = 360;

/**
 * 知虾 ZhiXia adapter. 接口具体 schema 需要拿到知虾企业版合同后再确认。
 * 当前实现：未配置 ZHIXIA_API_KEY 时返回 unconfigured；配置后会请求 ZHIXIA_API_BASE_URL，
 * 并以宽松的字段映射兜底，等真实接口文档到位后替换 normalizeZhiXiaPayload 即可。
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

function normalizeTopProduct(raw: LooseRecord): TopProductSignal | null {
  const id = pickString(raw.id, raw.product_id, raw.item_id, raw.itemid);
  const title = pickString(raw.title, raw.name, raw.product_name);
  if (!id || !title) return null;
  return {
    externalId: id,
    title,
    price: pickNumber(raw.price, raw.average_price, raw.unit_price),
    monthlySales: pickNumber(raw.monthly_sales, raw.sales, raw.sales_30d, raw.sold),
    rating: pickNumber(raw.rating, raw.score),
    reviewCount: pickNumber(raw.review_count, raw.comments, raw.rating_count),
    imageUrl: pickString(raw.image_url, raw.image, raw.cover),
    detailUrl: pickString(raw.detail_url, raw.url, raw.link),
  };
}

function normalizeZhiXiaPayload(json: unknown): Partial<MarketIntelSignal> {
  if (!json || typeof json !== "object") return {};
  const data = json as LooseRecord;

  const summary = (data.summary ?? data.overview ?? data.data ?? data) as LooseRecord;
  const productList = Array.isArray((data as LooseRecord).products)
    ? ((data as LooseRecord).products as LooseRecord[])
    : Array.isArray((summary as LooseRecord).products)
      ? ((summary as LooseRecord).products as LooseRecord[])
      : [];

  const topProducts = productList
    .map(normalizeTopProduct)
    .filter((item): item is TopProductSignal => Boolean(item))
    .slice(0, 10);

  return {
    averagePrice: pickNumber(summary.average_price, summary.avg_price),
    competitorCount: pickNumber(summary.competitor_count, summary.shop_count, summary.seller_count),
    estimatedSales: pickNumber(summary.estimated_sales, summary.monthly_sales, summary.sales_30d),
    trendYoy: pickNumber(summary.yoy, summary.growth_rate, summary.trend_yoy),
    topProducts,
    hotKeywords: Array.isArray((data as LooseRecord).keywords)
      ? ((data as LooseRecord).keywords as unknown[])
          .filter((value): value is string => typeof value === "string")
          .slice(0, 10)
      : undefined,
  };
}

export const zhixiaAdapter: MarketIntelAdapter = {
  provider: PROVIDER,

  supports(platform) {
    return platform === "Shopee" || platform === "Lazada";
  },

  isConfigured() {
    return Boolean(process.env.ZHIXIA_API_KEY && process.env.ZHIXIA_API_BASE_URL);
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
          "知虾 API 未配置。需要在 zhixia.com 购买企业版套餐并拿到 API Key，把 ZHIXIA_API_KEY 和 ZHIXIA_API_BASE_URL 填到 .env。",
      };
    }

    const cached = await readCachedSignal({
      platform: query.platform,
      category: query.category,
      country,
      provider: PROVIDER,
    });
    if (cached) return payloadToSignal(cached);

    const apiBase = process.env.ZHIXIA_API_BASE_URL!.replace(/\/+$/, "");
    const url = new URL(`${apiBase}/v1/market/category`);
    url.searchParams.set("platform", query.platform.toLowerCase().replace(/\s+/g, "_"));
    url.searchParams.set("category", query.category);
    if (country) url.searchParams.set("country", country);
    if (query.keyword) url.searchParams.set("keyword", query.keyword);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.ZHIXIA_API_KEY}`,
          "x-api-key": process.env.ZHIXIA_API_KEY!,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return { ...base, status: "error", message: `知虾 API ${response.status}` };
      }

      const json = (await response.json()) as unknown;
      const normalized = normalizeZhiXiaPayload(json);

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
        message: error instanceof Error ? error.message : "知虾 API 调用异常",
      };
    }
  },
};
