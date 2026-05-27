import type { PlatformName } from "@/data/phase5";
import { payloadToSignal, readCachedSignal, writeCachedSignal } from "./cache";
import type {
  MarketIntelAdapter,
  MarketIntelQuery,
  MarketIntelSignal,
  TopProductSignal,
} from "./types";

const PROVIDER = "rainforest" as const;
const CACHE_TTL_MIN = 360;

type RainforestSearchResult = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  price?: { value?: number | null };
  rating?: number | null;
  ratings_total?: number | null;
  recent_sales?: string;
};

type RainforestSearchResponse = {
  request_info?: { success?: boolean; message?: string };
  search_results?: RainforestSearchResult[];
};

function parseRecentSales(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/([\d,.]+)\s*([KMB]?)/i);
  if (!match) return null;
  const base = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;
  const multiplier = match[2]?.toUpperCase() === "B"
    ? 1_000_000_000
    : match[2]?.toUpperCase() === "M"
      ? 1_000_000
      : match[2]?.toUpperCase() === "K"
        ? 1_000
        : 1;
  return Math.round(base * multiplier);
}

function toTopProduct(item: RainforestSearchResult): TopProductSignal | null {
  if (!item.asin || !item.title) return null;
  return {
    externalId: item.asin,
    title: item.title,
    price: item.price?.value ?? null,
    monthlySales: parseRecentSales(item.recent_sales),
    rating: item.rating ?? null,
    reviewCount: item.ratings_total ?? null,
    imageUrl: item.image ?? null,
    detailUrl: item.link ?? null,
  };
}

export const rainforestAdapter: MarketIntelAdapter = {
  provider: PROVIDER,

  supports(platform) {
    return platform === "Amazon";
  },

  isConfigured() {
    return Boolean(process.env.RAINFOREST_API_KEY);
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
        message: "RAINFOREST_API_KEY 未配置，去 rainforestapi.com 获取后填入 .env",
      };
    }

    const cached = await readCachedSignal({
      platform: query.platform,
      category: query.category,
      country,
      provider: PROVIDER,
    });
    if (cached) return payloadToSignal(cached);

    const keyword = query.keyword?.trim() || query.category;
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.set("api_key", process.env.RAINFOREST_API_KEY!);
    url.searchParams.set("type", "search");
    url.searchParams.set(
      "amazon_domain",
      process.env.RAINFOREST_AMAZON_DOMAIN || "amazon.com"
    );
    url.searchParams.set("search_term", keyword);
    url.searchParams.set("number_of_results", "20");
    url.searchParams.set("exclude_sponsored", "true");

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        return { ...base, status: "error", message: `Rainforest API ${response.status}` };
      }

      const payload = (await response.json()) as RainforestSearchResponse;
      if (payload.request_info?.success === false) {
        return {
          ...base,
          status: "error",
          message: payload.request_info.message || "Rainforest API 返回失败",
        };
      }

      const results = payload.search_results ?? [];
      const topProducts = results
        .map(toTopProduct)
        .filter((item): item is TopProductSignal => Boolean(item))
        .slice(0, 10);

      const priced = topProducts.filter((item) => item.price !== null);
      const averagePrice = priced.length
        ? priced.reduce((sum, item) => sum + (item.price ?? 0), 0) / priced.length
        : null;

      const salesValues = topProducts
        .map((item) => item.monthlySales)
        .filter((value): value is number => value !== null);
      const estimatedSales = salesValues.length
        ? Math.round(salesValues.reduce((sum, value) => sum + value, 0) / salesValues.length)
        : null;

      const signal: MarketIntelSignal = {
        ...base,
        status: "ok",
        averagePrice,
        estimatedSales,
        competitorCount: null,
        topProducts,
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
        message: error instanceof Error ? error.message : "Rainforest API 调用异常",
      };
    }
  },
};

// type-only re-export so importing files don't have to know about PlatformName
export type { PlatformName };
