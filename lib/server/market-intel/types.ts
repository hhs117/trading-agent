import type { PlatformName } from "@/data/phase5";

export type MarketIntelProvider = "rainforest" | "zhixia" | "fastmoss" | "google-trends";

export type MarketIntelStatus = "ok" | "unconfigured" | "error";

export type MarketIntelQuery = {
  platform: PlatformName;
  category: string;
  country?: string | null;
  keyword?: string | null;
};

export type TopProductSignal = {
  externalId: string;
  title: string;
  price: number | null;
  monthlySales: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  detailUrl: string | null;
};

export type MarketIntelSignal = {
  platform: PlatformName;
  category: string;
  country: string | null;
  provider: MarketIntelProvider;
  status: MarketIntelStatus;
  fetchedAt: string;
  cached: boolean;
  message?: string;

  averagePrice?: number | null;
  competitorCount?: number | null;
  estimatedSales?: number | null;
  trendYoy?: number | null;
  trendDirection?: "up" | "down" | "stable";
  trendIndex?: number | null;
  topProducts?: TopProductSignal[];
  hotKeywords?: string[];
};

export interface MarketIntelAdapter {
  provider: MarketIntelProvider;
  supports(platform: PlatformName): boolean;
  isConfigured(): boolean;
  fetch(query: MarketIntelQuery): Promise<MarketIntelSignal>;
}
