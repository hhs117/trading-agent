import { getStorageData, setStorageData } from "@/lib/storage";
import type {
  Copywriting,
  ImageReview,
  Recommendation,
  ScoreDimensions,
} from "@/lib/types";

export type ProductPlatform =
  | "Shopee"
  | "Lazada"
  | "TikTok Shop"
  | "Amazon"
  | "Temu"
  | "AliExpress";

export type ProductStatus = "待上架" | "测试中" | "已上架" | "缺货" | "下架";

export type CompetitionLevel = "low" | "medium" | "high";
export type GrowthTrend = "up" | "down" | "stable";
export type RiskLevel = "low" | "medium" | "high";
export type PlatformFit = "high" | "medium" | "low";

export interface MockProduct {
  id: string;
  storeId?: string;
  name: string;
  category: string;
  platform: ProductPlatform;
  image: string;
  costPrice: number;
  salePrice: number;
  shippingCost: number;
  commissionRate: number;
  monthlySales: number;
  rating: number;
  reviewCount: number;
  supplier: string;
  targetMarket: string[];
  status: ProductStatus;
  createdAt: string;
  supplierUrl?: string;
  competitorUrl?: string;
  stock?: number;
  notes?: string;
  images?: string[];
  weight?: number;
  updatedAt?: string;
  score?: ScoreDimensions;
  totalScore?: number;
  recommendation?: Recommendation;
  copywritings?: Copywriting[];
  imageReviews?: ImageReview[];
}

export interface Competitor {
  id: string;
  name: string;
  platform: ProductPlatform;
  price: number;
  monthlySales: number;
  rating: number;
  reviewCount: number;
  shippingFrom: string;
  mainSellingPoints: string[];
  competitionLevel: CompetitionLevel;
  estimatedProfitRate: number;
  recommendationIndex: number;
  keywords?: string[];
}

export interface PlatformInfo {
  platformName: ProductPlatform;
  hotCategories: string[];
  averagePrice: number;
  competitorCount: number;
  estimatedSales: number;
  growthTrend: { direction: GrowthTrend; yoy: number };
  platformFit: PlatformFit;
  riskLevel: RiskLevel;
  suitableProducts: string[];
}

export const MOCK_STORAGE_KEYS = {
  products: "seapick:mockProducts",
  competitors: "seapick:competitors",
  platforms: "seapick:platforms",
} as const;

export const MOCK_PRODUCTS: MockProduct[] = [];
export const MOCK_COMPETITORS: Competitor[] = [];
export const MOCK_PLATFORMS: PlatformInfo[] = [];

export function getMockProducts(): MockProduct[] {
  return getStorageData<MockProduct[]>(MOCK_STORAGE_KEYS.products, []);
}

export function getMockCompetitors(): Competitor[] {
  return [];
}

export function getMockPlatforms(): PlatformInfo[] {
  return [];
}

export function reseedMockData(): void {
  setStorageData(MOCK_STORAGE_KEYS.products, []);
  setStorageData(MOCK_STORAGE_KEYS.competitors, []);
  setStorageData(MOCK_STORAGE_KEYS.platforms, []);
}

export function seedMockDataIfEmpty(): void {
  // Demo auto-seeding has been retired.
}

export function generateMockProductId(): string {
  return `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getMockProductById(id: string): MockProduct | undefined {
  return getMockProducts().find((p) => p.id === id);
}

export function upsertMockProduct(product: MockProduct): void {
  const list = getMockProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  const next = [...list];
  if (idx >= 0) next[idx] = product;
  else next.unshift(product);
  setStorageData(MOCK_STORAGE_KEYS.products, next);
}

export function deleteMockProduct(id: string): void {
  const next = getMockProducts().filter((p) => p.id !== id);
  setStorageData(MOCK_STORAGE_KEYS.products, next);
}

export const MOCK_PLATFORM_OPTIONS: ProductPlatform[] = [
  "Shopee",
  "Lazada",
  "TikTok Shop",
  "Amazon",
  "Temu",
  "AliExpress",
];

export const MOCK_STATUS_OPTIONS: ProductStatus[] = [
  "待上架",
  "测试中",
  "已上架",
  "缺货",
  "下架",
];

export const MOCK_CATEGORIES = [
  "数码电子",
  "服饰配件",
  "家居生活",
  "厨房用品",
  "母婴玩具",
  "美妆个护",
  "运动户外",
  "宠物用品",
  "食品饮料",
  "旅行收纳",
  "其他",
] as const;

export interface MarketOption {
  code: string;
  label: string;
  region: "SEA" | "Global";
}

export const MOCK_MARKET_OPTIONS: MarketOption[] = [
  { code: "TH", label: "泰国", region: "SEA" },
  { code: "VN", label: "越南", region: "SEA" },
  { code: "ID", label: "印尼", region: "SEA" },
  { code: "MY", label: "马来西亚", region: "SEA" },
  { code: "PH", label: "菲律宾", region: "SEA" },
  { code: "SG", label: "新加坡", region: "SEA" },
  { code: "US", label: "美国", region: "Global" },
  { code: "UK", label: "英国", region: "Global" },
  { code: "DE", label: "德国", region: "Global" },
  { code: "FR", label: "法国", region: "Global" },
  { code: "JP", label: "日本", region: "Global" },
  { code: "AU", label: "澳大利亚", region: "Global" },
  { code: "MX", label: "墨西哥", region: "Global" },
  { code: "BR", label: "巴西", region: "Global" },
  { code: "AE", label: "阿联酋", region: "Global" },
];

export const MOCK_MARKET_LABELS: Record<string, string> = MOCK_MARKET_OPTIONS.reduce(
  (acc, market) => {
    acc[market.code] = market.label;
    return acc;
  },
  {} as Record<string, string>
);

export const STATUS_TONE: Record<ProductStatus, "blue" | "green" | "orange" | "red" | "gray"> = {
  待上架: "blue",
  测试中: "orange",
  已上架: "green",
  缺货: "red",
  下架: "gray",
};
