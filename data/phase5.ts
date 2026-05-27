export type PlatformName = "Shopee" | "Lazada" | "TikTok Shop" | "Amazon" | "Temu" | "AliExpress";
export type TrendDirection = "up" | "down" | "stable";
export type FitLevel = "high" | "medium" | "low";
export type RiskLevel = "low" | "medium" | "high";
export type CompetitionLevel = "low" | "medium" | "high";

export interface PlatformAnalytics {
  name: PlatformName;
  hotCategories: string[];
  averagePrice: number;
  competitorCount: number;
  estimatedSales: number;
  growthTrend: {
    direction: TrendDirection;
    yoy: number;
  };
  fit: FitLevel;
  risk: RiskLevel;
  suitableProducts: string[];
  categoryBoost: Record<string, number>;
}

export interface CompetitorItem {
  id: string;
  name: string;
  platform: PlatformName;
  price: number | null;
  monthlySales: number | null;
  rating: number | null;
  reviewCount: number | null;
  shippingFrom: string;
  sellingPoints: string[];
  competition: CompetitionLevel;
  estimatedProfitRate: number | null;
  recommendationIndex: number | null;
  keywords: string[];
  source?: "mock" | "external" | "rainforest" | "zhixia" | "fastmoss" | "apify";
  externalId?: string | null;
  imageUrl?: string | null;
  detailUrl?: string | null;
}

export const PRODUCT_CATEGORIES = [
  "家居生活",
  "服饰配件",
  "美妆个护",
  "数码电子",
  "宠物用品",
  "运动户外",
  "母婴玩具",
  "厨房用品",
  "旅行收纳",
];

export const COMPETITORS: CompetitorItem[] = [];

export const COMPARE_STORAGE_KEY = "seapick:phase5:compareCompetitors";
export const MAX_COMPARE_COUNT = 5;

export function formatUsd(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

export function formatShortNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function fitLabel(level: FitLevel): string {
  return level === "high" ? "高" : level === "medium" ? "中" : "低";
}

export function riskLabel(level: RiskLevel): string {
  return level === "high" ? "高风险" : level === "medium" ? "中风险" : "低风险";
}

export function competitionLabel(level: CompetitionLevel): string {
  return level === "high" ? "竞争激烈" : level === "medium" ? "竞争中等" : "竞争较低";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

const PLATFORM_NAMES = new Set<PlatformName>(["Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"]);
const COMPETITION_LEVELS = new Set<CompetitionLevel>(["low", "medium", "high"]);

function isCompetitorItem(value: unknown): value is CompetitorItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CompetitorItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.platform === "string" &&
    PLATFORM_NAMES.has(item.platform as PlatformName) &&
    isNullableNumber(item.price) &&
    isNullableNumber(item.monthlySales) &&
    isNullableNumber(item.rating) &&
    isNullableNumber(item.reviewCount) &&
    typeof item.shippingFrom === "string" &&
    Array.isArray(item.sellingPoints) &&
    item.sellingPoints.every((point) => typeof point === "string") &&
    typeof item.competition === "string" &&
    COMPETITION_LEVELS.has(item.competition as CompetitionLevel) &&
    isNullableNumber(item.estimatedProfitRate) &&
    isNullableNumber(item.recommendationIndex) &&
    Array.isArray(item.keywords) &&
    item.keywords.every((keyword) => typeof keyword === "string")
  );
}

export function normalizeCompareItems(value: unknown): CompetitorItem[] {
  if (!Array.isArray(value)) return [];

  const items = value
    .map((item) => {
      if (typeof item === "string") return undefined;
      return isCompetitorItem(item) ? item : undefined;
    })
    .filter((item): item is CompetitorItem => Boolean(item));

  return Array.from(new Map(items.map((item) => [item.id, item])).values()).slice(0, MAX_COMPARE_COUNT);
}

export function getCompareItems(): CompetitorItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCompareItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function getCompareIds(): string[] {
  return getCompareItems().map((item) => item.id);
}

export function saveCompareItems(items: CompetitorItem[]) {
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(normalizeCompareItems(items)));
  window.dispatchEvent(new Event("phase5-compare-change"));
}

export function saveCompareIds(ids: string[]) {
  saveCompareItems(normalizeCompareItems(ids));
}

export function addCompareItem(item: CompetitorItem): { ok: boolean; reason?: "duplicate" | "full" } {
  const items = getCompareItems();
  if (items.some((existing) => existing.id === item.id)) return { ok: false, reason: "duplicate" };
  if (items.length >= MAX_COMPARE_COUNT) return { ok: false, reason: "full" };
  saveCompareItems([...items, item]);
  return { ok: true };
}

export function removeCompareItem(id: string) {
  saveCompareItems(getCompareItems().filter((item) => item.id !== id));
}

export function clearCompareItems() {
  saveCompareItems([]);
}

export function subscribeCompareItems(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("phase5-compare-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("phase5-compare-change", handler);
    window.removeEventListener("storage", handler);
  };
}
