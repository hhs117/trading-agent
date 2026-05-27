import {
  type CompetitorItem,
  type CompetitionLevel,
  type PlatformName,
} from "@/data/phase5";

export type ProductSearchProvider =
  | "unconfigured"
  | "auto"
  | "mock"
  | "external"
  | "rainforest"
  | "zhixia"
  | "fastmoss"
  | "apify";

export type ProductSearchQuery = {
  keyword: string;
  platform?: PlatformName | "";
  limit?: number;
};

export type ProductSearchResult = {
  items: CompetitorItem[];
  /**
   * 单源模式下是该源的名字；auto 模式下若实际命中多源则是 "auto"，命中单源则是该源名。
   * 旧前端只用这个字段渲染数据源 badge，保留兼容。
   */
  provider: ProductSearchProvider;
  providers: ProductSearchProvider[];
  requestedProvider: ProductSearchProvider;
  fallbackUsed: boolean;
  warning?: string;
  warnings?: string[];
};

const PLATFORM_NAMES = new Set<PlatformName>(["Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"]);
const COMPETITION_LEVELS = new Set<CompetitionLevel>(["low", "medium", "high"]);

type LooseRecord = Record<string, unknown>;

// ------------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------------

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toNullableNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function pickStringArray(...candidates: unknown[]): string[] {
  for (const value of candidates) {
    if (Array.isArray(value)) {
      const cleaned = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
      if (cleaned.length) return cleaned;
    }
  }
  return [];
}

function parseRecentSales(value?: string | null): number | null {
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

function deriveCompetition(reviewCount: number | null, monthlySales: number | null): CompetitionLevel {
  if ((reviewCount ?? 0) >= 3000 || (monthlySales ?? 0) >= 5000) return "high";
  if ((reviewCount ?? 0) >= 500 || (monthlySales ?? 0) >= 1000) return "medium";
  return "low";
}

function deriveRecommendation(input: {
  rating: number | null;
  reviewCount: number | null;
  monthlySales: number | null;
  price: number | null;
}): number | null {
  if (input.rating === null && input.reviewCount === null && input.monthlySales === null) return null;
  const ratingScore = input.rating === null ? 0 : Math.min(Math.max((input.rating - 3) / 2, 0), 1) * 4;
  const reviewScore = input.reviewCount === null ? 0 : Math.min(input.reviewCount / 3000, 1) * 2;
  const salesScore = input.monthlySales === null ? 0 : Math.min(input.monthlySales / 5000, 1) * 3;
  const priceScore = input.price === null ? 0 : input.price >= 10 && input.price <= 80 ? 1 : 0.5;
  return Math.max(1, Math.min(10, Math.round(ratingScore + reviewScore + salesScore + priceScore)));
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

// ------------------------------------------------------------------
// Adapter contract
// ------------------------------------------------------------------

type ProductSearchAdapter = {
  provider: Exclude<ProductSearchProvider, "unconfigured" | "auto" | "mock" | "external">;
  platforms: PlatformName[];
  isConfigured(): boolean;
  unconfiguredMessage: string;
  search(query: ProductSearchQuery): Promise<CompetitorItem[]>;
};

// ------------------------------------------------------------------
// Mock provider
// ------------------------------------------------------------------

const MOCK_SEARCH_ITEMS: CompetitorItem[] = [
  {
    id: "mock-shopee-storage-cube",
    name: "Foldable Fabric Storage Cube Organizer Box",
    platform: "Shopee",
    price: 5.8,
    monthlySales: 6800,
    rating: 4.7,
    reviewCount: 2400,
    shippingFrom: "Yiwu, China",
    sellingPoints: ["lightweight", "foldable", "home storage", "low shipping cost"],
    competition: "medium",
    estimatedProfitRate: 34,
    recommendationIndex: 9,
    keywords: ["storage", "organizer", "home"],
    source: "mock",
    externalId: "mock-shopee-storage-cube",
    imageUrl: "https://placehold.co/800x800?text=Storage+Cube",
    detailUrl: "https://example.com/source/storage-cube",
  },
  {
    id: "mock-tiktok-pet-feeder",
    name: "Automatic Pet Feeder 4L Timed Food Dispenser",
    platform: "TikTok Shop",
    price: 39.9,
    monthlySales: 1900,
    rating: 4.6,
    reviewCount: 860,
    shippingFrom: "Shenzhen, China",
    sellingPoints: ["pet category", "video friendly", "higher ticket", "repeat demand"],
    competition: "medium",
    estimatedProfitRate: 27,
    recommendationIndex: 8,
    keywords: ["pet", "feeder", "automatic"],
    source: "mock",
    externalId: "mock-tiktok-pet-feeder",
    imageUrl: "https://placehold.co/800x800?text=Pet+Feeder",
    detailUrl: "https://example.com/source/pet-feeder",
  },
  {
    id: "mock-amazon-camping-lantern",
    name: "Solar Folding Camping Lantern with USB Power Bank",
    platform: "Amazon",
    price: 24.99,
    monthlySales: 3200,
    rating: 4.5,
    reviewCount: 1300,
    shippingFrom: "Guangdong, China",
    sellingPoints: ["outdoor", "solar charging", "emergency use", "bundle potential"],
    competition: "high",
    estimatedProfitRate: 25,
    recommendationIndex: 7,
    keywords: ["camping", "lantern", "solar"],
    source: "mock",
    externalId: "mock-amazon-camping-lantern",
    imageUrl: "https://placehold.co/800x800?text=Camping+Lantern",
    detailUrl: "https://example.com/source/camping-lantern",
  },
  {
    id: "mock-lazada-kitchen-peeler",
    name: "Stainless Steel Kitchen Peeler Set 4 Pieces",
    platform: "Lazada",
    price: 4.49,
    monthlySales: 7200,
    rating: 4.4,
    reviewCount: 3900,
    shippingFrom: "Foshan, China",
    sellingPoints: ["small item", "kitchen daily use", "bundle set", "low price"],
    competition: "high",
    estimatedProfitRate: 18,
    recommendationIndex: 6,
    keywords: ["kitchen", "peeler", "tools"],
    source: "mock",
    externalId: "mock-lazada-kitchen-peeler",
    imageUrl: "https://placehold.co/800x800?text=Kitchen+Peeler",
    detailUrl: "https://example.com/source/kitchen-peeler",
  },
  {
    id: "mock-aliexpress-sleep-mask",
    name: "Silk Sleep Eye Mask Adjustable Strap Gift Box",
    platform: "AliExpress",
    price: 6.99,
    monthlySales: 5100,
    rating: 4.8,
    reviewCount: 2800,
    shippingFrom: "Guangzhou, China",
    sellingPoints: ["gift box", "beauty sleep", "lightweight", "multi color"],
    competition: "medium",
    estimatedProfitRate: 38,
    recommendationIndex: 9,
    keywords: ["sleep mask", "silk", "beauty"],
    source: "mock",
    externalId: "mock-aliexpress-sleep-mask",
    imageUrl: "https://placehold.co/800x800?text=Sleep+Mask",
    detailUrl: "https://example.com/source/sleep-mask",
  },
  {
    id: "mock-temu-travel-packing-cubes",
    name: "Travel Packing Cubes 6 Set Waterproof Organizer",
    platform: "Temu",
    price: 9.9,
    monthlySales: 8800,
    rating: 4.6,
    reviewCount: 5200,
    shippingFrom: "Zhejiang, China",
    sellingPoints: ["travel season", "set bundle", "visual product", "easy listing"],
    competition: "high",
    estimatedProfitRate: 22,
    recommendationIndex: 7,
    keywords: ["travel", "packing", "organizer"],
    source: "mock",
    externalId: "mock-temu-travel-packing-cubes",
    imageUrl: "https://placehold.co/800x800?text=Packing+Cubes",
    detailUrl: "https://example.com/source/packing-cubes",
  },
];

function searchMockItems(query: ProductSearchQuery): CompetitorItem[] {
  const keyword = query.keyword.trim().toLowerCase();
  return MOCK_SEARCH_ITEMS.filter((item) => {
    if (query.platform && item.platform !== query.platform) return false;
    if (!keyword) return true;
    const haystack = [item.name, item.platform, item.shippingFrom, ...item.sellingPoints, ...item.keywords]
      .join(" ")
      .toLowerCase();
    return haystack.includes(keyword);
  }).slice(0, query.limit);
}

// ------------------------------------------------------------------
// External (generic webhook) provider — kept for self-hosted endpoints
// ------------------------------------------------------------------

function normalizeExternalItem(value: unknown): CompetitorItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as LooseRecord;

  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.platform !== "string" ||
    !PLATFORM_NAMES.has(item.platform as PlatformName)
  ) {
    return null;
  }

  const competition =
    typeof item.competition === "string" && COMPETITION_LEVELS.has(item.competition as CompetitionLevel)
      ? (item.competition as CompetitionLevel)
      : "medium";

  return {
    id: item.id,
    name: item.name,
    platform: item.platform as PlatformName,
    price: toNullableNumber(item.price),
    monthlySales: toNullableNumber(item.monthlySales),
    rating: toNullableNumber(item.rating),
    reviewCount: toNullableNumber(item.reviewCount),
    shippingFrom: typeof item.shippingFrom === "string" ? item.shippingFrom : "",
    sellingPoints: pickStringArray(item.sellingPoints),
    competition,
    estimatedProfitRate: toNullableNumber(item.estimatedProfitRate),
    recommendationIndex: toNullableNumber(item.recommendationIndex),
    keywords: pickStringArray(item.keywords),
    source: "external",
    externalId: typeof item.externalId === "string" ? item.externalId : null,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
    detailUrl: typeof item.detailUrl === "string" ? item.detailUrl : null,
  };
}

async function searchExternalItems(query: ProductSearchQuery): Promise<CompetitorItem[]> {
  const endpoint = process.env.PRODUCT_SEARCH_API_URL;
  if (!endpoint) throw new Error("PRODUCT_SEARCH_API_URL is not configured");

  const url = new URL(endpoint);
  url.searchParams.set("keyword", query.keyword);
  if (query.platform) url.searchParams.set("platform", query.platform);
  if (query.limit) url.searchParams.set("limit", String(query.limit));

  const apiKey = process.env.PRODUCT_SEARCH_API_KEY;
  const response = await fetch(url, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } : undefined,
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Product search provider returned ${response.status}`);

  const payload = (await response.json()) as unknown;
  const rawItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  return rawItems
    .map(normalizeExternalItem)
    .filter((item): item is CompetitorItem => Boolean(item))
    .slice(0, query.limit);
}

// ------------------------------------------------------------------
// Rainforest adapter (Amazon)
// ------------------------------------------------------------------

type RainforestSearchResult = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  price?: { value?: number | null };
  rating?: number | null;
  ratings_total?: number | null;
  recent_sales?: string;
  is_prime?: boolean;
  amazons_choice?: boolean;
  deal?: { badge_text?: string };
  categories?: { name?: string } | Array<{ name?: string }>;
};

type RainforestSearchResponse = {
  request_info?: { success?: boolean; message?: string };
  search_results?: RainforestSearchResult[];
};

function firstCategoryName(value: RainforestSearchResult["categories"]): string | undefined {
  if (Array.isArray(value)) return value.find((item) => item?.name)?.name;
  return value?.name;
}

function normalizeRainforestItem(item: RainforestSearchResult, query: ProductSearchQuery): CompetitorItem | null {
  if (!item.asin || !item.title) return null;

  const price = toNullableNumber(item.price?.value);
  const rating = toNullableNumber(item.rating);
  const reviewCount = toNullableNumber(item.ratings_total);
  const monthlySales = parseRecentSales(item.recent_sales);
  const categoryName = firstCategoryName(item.categories);
  const sellingPoints = [
    item.amazons_choice ? "Amazon's Choice" : null,
    item.is_prime ? "Prime" : null,
    item.deal?.badge_text ?? null,
    monthlySales ? `${monthlySales.toLocaleString()}+ 月购` : null,
    categoryName ?? null,
  ].filter((point): point is string => Boolean(point));

  return {
    id: `amazon-${item.asin}`,
    externalId: item.asin,
    name: item.title,
    platform: "Amazon",
    price,
    monthlySales,
    rating,
    reviewCount,
    shippingFrom: "Amazon US",
    sellingPoints,
    competition: deriveCompetition(reviewCount, monthlySales),
    estimatedProfitRate: null,
    recommendationIndex: deriveRecommendation({ rating, reviewCount, monthlySales, price }),
    keywords: [query.keyword, categoryName].filter((keyword): keyword is string => Boolean(keyword)),
    source: "rainforest",
    imageUrl: item.image ?? null,
    detailUrl: item.link ?? null,
  };
}

const rainforestAdapter: ProductSearchAdapter = {
  provider: "rainforest",
  platforms: ["Amazon"],
  isConfigured: () => Boolean(process.env.RAINFOREST_API_KEY),
  unconfiguredMessage: "Amazon 数据未配置：填入 RAINFOREST_API_KEY 后即可使用。",
  async search(query) {
    const apiKey = process.env.RAINFOREST_API_KEY!;
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("type", "search");
    url.searchParams.set("amazon_domain", process.env.RAINFOREST_AMAZON_DOMAIN || "amazon.com");
    url.searchParams.set("search_term", query.keyword);
    url.searchParams.set("number_of_results", String(query.limit ?? 30));
    url.searchParams.set("exclude_sponsored", "true");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Rainforest API returned ${response.status}`);

    const payload = (await response.json()) as RainforestSearchResponse;
    if (payload.request_info?.success === false) {
      throw new Error(payload.request_info.message || "Rainforest API request failed");
    }

    return (payload.search_results ?? [])
      .map((item) => normalizeRainforestItem(item, query))
      .filter((item): item is CompetitorItem => Boolean(item))
      .slice(0, query.limit);
  },
};

// ------------------------------------------------------------------
// Zhixia adapter (Shopee / Lazada)
// 知虾 keyword 搜索接口；schema 字段拿到企业版接口文档后再细化，
// 当前用宽松字段映射兜底。
// ------------------------------------------------------------------

function platformToZhixiaSite(platform: PlatformName): string {
  if (platform === "Shopee") return "shopee";
  if (platform === "Lazada") return "lazada";
  return platform.toLowerCase().replace(/\s+/g, "_");
}

function normalizeZhixiaItem(raw: LooseRecord, platform: PlatformName, query: ProductSearchQuery): CompetitorItem | null {
  const externalId = pickString(raw.id, raw.product_id, raw.item_id, raw.itemid);
  const name = pickString(raw.title, raw.name, raw.product_name);
  if (!externalId || !name) return null;

  const price = pickNumber(raw.price, raw.average_price, raw.unit_price);
  const monthlySales = pickNumber(raw.monthly_sales, raw.sales, raw.sales_30d, raw.sold);
  const rating = pickNumber(raw.rating, raw.score);
  const reviewCount = pickNumber(raw.review_count, raw.comments, raw.rating_count);
  const shippingFrom = pickString(raw.shipping_from, raw.ship_from, raw.shop_location, raw.location, raw.country) ?? "";
  const sellingPoints = pickStringArray(raw.selling_points, raw.tags, raw.labels);

  return {
    id: sanitizeId(`zhixia-${platformToZhixiaSite(platform)}-${externalId}`),
    externalId,
    name,
    platform,
    price,
    monthlySales,
    rating,
    reviewCount,
    shippingFrom,
    sellingPoints,
    competition: deriveCompetition(reviewCount, monthlySales),
    estimatedProfitRate: pickNumber(raw.profit_rate, raw.estimated_profit_rate),
    recommendationIndex: deriveRecommendation({ rating, reviewCount, monthlySales, price }),
    keywords: [query.keyword, ...pickStringArray(raw.keywords)].filter(Boolean) as string[],
    source: "zhixia",
    imageUrl: pickString(raw.image_url, raw.image, raw.cover),
    detailUrl: pickString(raw.detail_url, raw.url, raw.link),
  };
}

async function searchZhixiaForPlatform(platform: PlatformName, query: ProductSearchQuery): Promise<CompetitorItem[]> {
  const apiBase = process.env.ZHIXIA_API_BASE_URL!.replace(/\/+$/, "");
  const apiKey = process.env.ZHIXIA_API_KEY!;
  const url = new URL(`${apiBase}/v1/product/search`);
  url.searchParams.set("platform", platformToZhixiaSite(platform));
  url.searchParams.set("keyword", query.keyword);
  url.searchParams.set("limit", String(query.limit ?? 30));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`知虾 API ${response.status}`);

  const payload = (await response.json()) as unknown;
  const root = (payload && typeof payload === "object" ? (payload as LooseRecord) : {}) as LooseRecord;
  const data = (root.data ?? root.result ?? root) as LooseRecord;
  const list = Array.isArray(data.products)
    ? (data.products as LooseRecord[])
    : Array.isArray(data.list)
      ? (data.list as LooseRecord[])
      : Array.isArray(data.items)
        ? (data.items as LooseRecord[])
        : [];

  return list
    .map((raw) => normalizeZhixiaItem(raw, platform, query))
    .filter((item): item is CompetitorItem => Boolean(item));
}

const zhixiaAdapter: ProductSearchAdapter = {
  provider: "zhixia",
  platforms: ["Shopee", "Lazada"],
  isConfigured: () => Boolean(process.env.ZHIXIA_API_KEY && process.env.ZHIXIA_API_BASE_URL),
  unconfiguredMessage:
    "Shopee/Lazada 数据未配置：需要 zhixia.com 企业版账号，把 ZHIXIA_API_KEY 与 ZHIXIA_API_BASE_URL 填到 .env。",
  async search(query) {
    const targets: PlatformName[] = query.platform
      ? [query.platform]
      : ["Shopee", "Lazada"];
    const results = await Promise.all(
      targets.map((platform) => searchZhixiaForPlatform(platform, query).catch((error) => {
        // 单平台失败不致全失败：以错误形式抛回，调用方决定降级
        throw error instanceof Error ? error : new Error(String(error));
      }))
    );
    const merged = results.flat();
    return query.limit ? merged.slice(0, query.limit) : merged;
  },
};

// ------------------------------------------------------------------
// FastMoss adapter (TikTok Shop)
// ------------------------------------------------------------------

function normalizeFastmossItem(raw: LooseRecord, query: ProductSearchQuery): CompetitorItem | null {
  const externalId = pickString(raw.product_id, raw.id, raw.item_id);
  const name = pickString(raw.title, raw.product_name, raw.name);
  if (!externalId || !name) return null;

  const price = pickNumber(raw.price, raw.avg_price);
  const monthlySales = pickNumber(raw.sales_30d, raw.monthly_sales, raw.sold_count);
  const rating = pickNumber(raw.rating, raw.score);
  const reviewCount = pickNumber(raw.review_count, raw.comments);
  const shippingFrom = pickString(raw.ship_from, raw.shop_location, raw.region, raw.country) ?? "";
  const sellingPoints = pickStringArray(raw.tags, raw.labels, raw.selling_points);

  return {
    id: sanitizeId(`fastmoss-tiktok-${externalId}`),
    externalId,
    name,
    platform: "TikTok Shop",
    price,
    monthlySales,
    rating,
    reviewCount,
    shippingFrom,
    sellingPoints,
    competition: deriveCompetition(reviewCount, monthlySales),
    estimatedProfitRate: pickNumber(raw.profit_rate, raw.estimated_profit_rate),
    recommendationIndex: deriveRecommendation({ rating, reviewCount, monthlySales, price }),
    keywords: [query.keyword, ...pickStringArray(raw.keywords)].filter(Boolean) as string[],
    source: "fastmoss",
    imageUrl: pickString(raw.image, raw.cover, raw.image_url),
    detailUrl: pickString(raw.detail_url, raw.url),
  };
}

const fastmossAdapter: ProductSearchAdapter = {
  provider: "fastmoss",
  platforms: ["TikTok Shop"],
  isConfigured: () => Boolean(process.env.FASTMOSS_API_KEY && process.env.FASTMOSS_API_BASE_URL),
  unconfiguredMessage:
    "TikTok Shop 数据未配置：需要 fastmoss.com 套餐 + API Key，把 FASTMOSS_API_KEY 与 FASTMOSS_API_BASE_URL 填到 .env。",
  async search(query) {
    const apiBase = process.env.FASTMOSS_API_BASE_URL!.replace(/\/+$/, "");
    const apiKey = process.env.FASTMOSS_API_KEY!;
    const url = new URL(`${apiBase}/v1/product/search`);
    url.searchParams.set("keyword", query.keyword);
    url.searchParams.set("limit", String(query.limit ?? 30));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`FastMoss API ${response.status}`);

    const payload = (await response.json()) as unknown;
    const root = (payload && typeof payload === "object" ? (payload as LooseRecord) : {}) as LooseRecord;
    const data = (root.data ?? root.result ?? root) as LooseRecord;
    const list = Array.isArray(data.products)
      ? (data.products as LooseRecord[])
      : Array.isArray(data.list)
        ? (data.list as LooseRecord[])
        : Array.isArray(data.items)
          ? (data.items as LooseRecord[])
          : [];

    return list
      .map((raw) => normalizeFastmossItem(raw, query))
      .filter((item): item is CompetitorItem => Boolean(item))
      .slice(0, query.limit);
  },
};

// ------------------------------------------------------------------
// Apify adapter (Temu)
// 走 Apify 平台的同步 run 接口（run-sync-get-dataset-items），
// 具体使用哪个 Temu scraper actor 由 APIFY_TEMU_ACTOR_ID 决定，
// 字段名各 actor 不一，这里宽松映射主流字段。
// ------------------------------------------------------------------

function parsePriceLike(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  if (value && typeof value === "object") {
    const obj = value as LooseRecord;
    return parsePriceLike(
      obj.value ?? obj.amount ?? obj.current ?? obj.price ?? obj.current_price ?? obj.sale_price
    );
  }
  return null;
}

function parseSalesLike(value: unknown): number | null {
  const direct = pickNumber(value);
  if (direct !== null) return direct;
  if (typeof value === "string") return parseRecentSales(value);
  return null;
}

function firstStringFromArray(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) return entry;
      if (entry && typeof entry === "object") {
        const obj = entry as LooseRecord;
        const nested = pickString(obj.url, obj.src, obj.image, obj.imageUrl);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function normalizeApifyTemuItem(raw: LooseRecord, query: ProductSearchQuery): CompetitorItem | null {
  const externalId = pickString(
    raw.goods_id,
    raw.goodsId,
    raw.product_id,
    raw.productId,
    raw.id,
    raw.sku_id,
    raw.skuId,
    raw.item_id
  );
  const name = pickString(raw.title, raw.product_name, raw.goods_name, raw.name);
  if (!externalId || !name) return null;

  const price = parsePriceLike(
    raw.price ?? raw.current_price ?? raw.sale_price ?? raw.salePrice ?? raw.priceInfo ?? raw.priceObj
  );
  const monthlySales = parseSalesLike(
    raw.sales ?? raw.sales_count ?? raw.salesCount ?? raw.sold ?? raw.sold_count ?? raw.monthly_sales
  );
  const rating = pickNumber(raw.rating, raw.score, raw.review_score, raw.avg_rating);
  // reviews / totalReviews 经常是 "1.2K+" 这种字符串，走 sales 同款解析
  const reviewCount = parseSalesLike(
    raw.review_count ?? raw.reviewCount ?? raw.reviews ?? raw.totalReviews ?? raw.comments ?? raw.ratings_count
  );
  const shippingFrom = pickString(raw.ship_from, raw.shipping_from, raw.shop_location, raw.country, raw.region) ?? "";
  const sellingPoints = pickStringArray(raw.tags, raw.labels, raw.selling_points, raw.badges);

  const imageUrl =
    pickString(raw.image, raw.image_url, raw.imageUrl, raw.thumb_url, raw.cover, raw.main_image) ??
    firstStringFromArray(raw.images) ??
    firstStringFromArray(raw.additionalImages);

  return {
    id: sanitizeId(`apify-temu-${externalId}`),
    externalId,
    name,
    platform: "Temu",
    price,
    monthlySales,
    rating,
    reviewCount,
    shippingFrom,
    sellingPoints,
    competition: deriveCompetition(reviewCount, monthlySales),
    estimatedProfitRate: pickNumber(raw.profit_rate, raw.estimated_profit_rate),
    recommendationIndex: deriveRecommendation({ rating, reviewCount, monthlySales, price }),
    keywords: [query.keyword, ...pickStringArray(raw.keywords)].filter(Boolean) as string[],
    source: "apify",
    imageUrl,
    detailUrl: pickString(raw.detail_url, raw.detailUrl, raw.url, raw.productUrl, raw.link, raw.product_url),
  };
}

const apifyTemuAdapter: ProductSearchAdapter = {
  provider: "apify",
  platforms: ["Temu"],
  isConfigured: () => Boolean(process.env.APIFY_API_TOKEN && process.env.APIFY_TEMU_ACTOR_ID),
  unconfiguredMessage:
    "Temu 数据未配置：需要 Apify 账号 + 一个 Temu scraper actor，把 APIFY_API_TOKEN 与 APIFY_TEMU_ACTOR_ID 填到 .env。",
  async search(query) {
    const token = process.env.APIFY_API_TOKEN!;
    // Apify 在 URL 里用 ~ 替代 actor slug 的 /，用户填 username/actor 或 username~actor 都接受
    const actorSlug = process.env.APIFY_TEMU_ACTOR_ID!.replace(/\//g, "~");
    const country = process.env.APIFY_TEMU_COUNTRY?.trim() || "US";
    const timeoutSecs = Math.max(30, Math.min(Number(process.env.APIFY_TEMU_TIMEOUT_SECS ?? 120), 600));
    const limit = query.limit ?? 30;

    const url = new URL(`https://api.apify.com/v2/acts/${actorSlug}/run-sync-get-dataset-items`);
    url.searchParams.set("token", token);
    url.searchParams.set("timeout", String(timeoutSecs));

    // 各家 Temu actor 字段命名不一，全塞进去取交集；actor 会忽略它不认识的字段
    const input = {
      searchTerms: [query.keyword],
      queries: [query.keyword],
      keywords: [query.keyword],
      search: query.keyword,
      searchQueries: [query.keyword],
      maxItems: limit,
      maxResults: limit,
      maxProducts: limit,
      country,
      countryCode: country,
      proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Apify Temu actor ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }

    const payload = (await response.json()) as unknown;
    const list: LooseRecord[] = Array.isArray(payload)
      ? (payload as LooseRecord[])
      : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
        ? ((payload as { items: LooseRecord[] }).items)
        : [];

    return list
      .map((raw) => normalizeApifyTemuItem(raw, query))
      .filter((item): item is CompetitorItem => Boolean(item))
      .slice(0, limit);
  },
};

// ------------------------------------------------------------------
// Adapter registry
// ------------------------------------------------------------------

const ADAPTERS: ProductSearchAdapter[] = [rainforestAdapter, zhixiaAdapter, fastmossAdapter, apifyTemuAdapter];

const ADAPTER_BY_PLATFORM: Record<PlatformName, ProductSearchAdapter | null> = {
  Shopee: zhixiaAdapter,
  Lazada: zhixiaAdapter,
  "TikTok Shop": fastmossAdapter,
  Amazon: rainforestAdapter,
  Temu: apifyTemuAdapter,
  AliExpress: null,
};

export function getProductSearchSourceHealth() {
  return ADAPTERS.map((adapter) => ({
    provider: adapter.provider,
    platforms: adapter.platforms,
    configured: adapter.isConfigured(),
  }));
}

// ------------------------------------------------------------------
// Provider selection
// ------------------------------------------------------------------

function readRequestedProvider(): ProductSearchProvider {
  const raw = process.env.PRODUCT_SEARCH_PROVIDER?.toLowerCase();
  switch (raw) {
    case "mock":
    case "external":
    case "rainforest":
    case "zhixia":
    case "fastmoss":
    case "apify":
    case "auto":
      return raw;
    case undefined:
    case "":
      return "auto";
    default:
      return "unconfigured";
  }
}

function dedupeById(items: CompetitorItem[]): CompetitorItem[] {
  const seen = new Set<string>();
  const out: CompetitorItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

async function runAdapter(
  adapter: ProductSearchAdapter,
  query: ProductSearchQuery
): Promise<{ items: CompetitorItem[]; provider: ProductSearchProvider; warning?: string }> {
  if (!adapter.isConfigured()) {
    return { items: [], provider: adapter.provider, warning: adapter.unconfiguredMessage };
  }
  try {
    const items = await adapter.search(query);
    return { items, provider: adapter.provider };
  } catch (error) {
    return {
      items: [],
      provider: adapter.provider,
      warning: `${adapter.provider} 搜索失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runAuto(query: ProductSearchQuery): Promise<ProductSearchResult> {
  const requestedProvider: ProductSearchProvider = "auto";

  // 指定平台 → 路由到对应 adapter
  if (query.platform) {
    const adapter = ADAPTER_BY_PLATFORM[query.platform];
    if (!adapter) {
      return {
        items: [],
        provider: "auto",
        providers: [],
        requestedProvider,
        fallbackUsed: false,
        warning: `${query.platform} 暂未接入第三方数据源（Temu / AliExpress 当前需要单独对接）。`,
      };
    }
    const result = await runAdapter(adapter, query);
    return {
      items: result.items,
      provider: result.provider,
      providers: result.items.length || result.warning ? [result.provider] : [],
      requestedProvider,
      fallbackUsed: false,
      warning: result.warning,
      warnings: result.warning ? [result.warning] : undefined,
    };
  }

  // 未指定平台 → 并行查所有 adapter
  const settled = await Promise.all(ADAPTERS.map((adapter) => runAdapter(adapter, query)));
  const items = dedupeById(settled.flatMap((entry) => entry.items));
  const providersUsed = settled.filter((entry) => entry.items.length > 0).map((entry) => entry.provider);
  const warnings = settled.map((entry) => entry.warning).filter((message): message is string => Boolean(message));
  const provider: ProductSearchProvider =
    providersUsed.length === 1 ? providersUsed[0] : providersUsed.length === 0 ? "auto" : "auto";

  return {
    items: query.limit ? items.slice(0, query.limit) : items,
    provider,
    providers: providersUsed,
    requestedProvider,
    fallbackUsed: false,
    warning: warnings.length ? warnings.join("\n") : undefined,
    warnings: warnings.length ? warnings : undefined,
  };
}

// ------------------------------------------------------------------
// Public entry
// ------------------------------------------------------------------

export async function searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult> {
  const requestedProvider = readRequestedProvider();
  const limit = Math.max(1, Math.min(query.limit ?? 30, 100));
  const normalizedQuery: ProductSearchQuery = { ...query, limit };

  if (requestedProvider === "mock") {
    return {
      items: searchMockItems(normalizedQuery),
      provider: "mock",
      providers: ["mock"],
      requestedProvider,
      fallbackUsed: false,
      warning: "Using mock all-web product data. Configure a real provider when source data is ready.",
    };
  }

  if (requestedProvider === "external") {
    try {
      return {
        items: await searchExternalItems(normalizedQuery),
        provider: "external",
        providers: ["external"],
        requestedProvider,
        fallbackUsed: false,
      };
    } catch (error) {
      return {
        items: [],
        provider: "external",
        providers: [],
        requestedProvider,
        fallbackUsed: false,
        warning: error instanceof Error ? error.message : "External product search failed",
      };
    }
  }

  // Single-source provider modes (rainforest / zhixia / fastmoss)
  const singleAdapter = ADAPTERS.find((adapter) => adapter.provider === requestedProvider);
  if (singleAdapter) {
    if (normalizedQuery.platform && !singleAdapter.platforms.includes(normalizedQuery.platform)) {
      return {
        items: [],
        provider: singleAdapter.provider,
        providers: [],
        requestedProvider,
        fallbackUsed: false,
        warning: `${singleAdapter.provider} 仅支持 ${singleAdapter.platforms.join(" / ")}，请改用 auto 模式或切换数据源。`,
      };
    }
    const result = await runAdapter(singleAdapter, normalizedQuery);
    return {
      items: result.items,
      provider: result.provider,
      providers: result.items.length ? [result.provider] : [],
      requestedProvider,
      fallbackUsed: false,
      warning: result.warning,
    };
  }

  if (requestedProvider === "auto") {
    return runAuto(normalizedQuery);
  }

  return {
    items: [],
    provider: "unconfigured",
    providers: [],
    requestedProvider,
    fallbackUsed: false,
    warning: "Product search provider is not configured",
  };
}
