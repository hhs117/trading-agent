import type { PlatformName } from "@/data/phase5";
import { fastmossAdapter } from "./fastmoss";
import { googleTrendsAdapter } from "./google-trends";
import { rainforestAdapter } from "./rainforest";
import type { MarketIntelAdapter, MarketIntelSignal } from "./types";
import { zhixiaAdapter } from "./zhixia";

const ADAPTERS: MarketIntelAdapter[] = [
  rainforestAdapter,
  zhixiaAdapter,
  fastmossAdapter,
  googleTrendsAdapter,
];

export type PlatformMarketIntel = {
  platform: PlatformName;
  category: string;
  country: string | null;
  primary: MarketIntelSignal | null;
  trends: MarketIntelSignal | null;
  warnings: string[];
};

const PRIMARY_BY_PLATFORM: Record<PlatformName, MarketIntelAdapter | null> = {
  Shopee: zhixiaAdapter,
  Lazada: zhixiaAdapter,
  "TikTok Shop": fastmossAdapter,
  Amazon: rainforestAdapter,
  Temu: null,
  AliExpress: null,
};

export async function getPlatformMarketIntel(input: {
  platform: PlatformName;
  category: string;
  country?: string | null;
  keyword?: string | null;
}): Promise<PlatformMarketIntel> {
  const country = input.country ?? null;
  const query = {
    platform: input.platform,
    category: input.category,
    country,
    keyword: input.keyword ?? null,
  };

  const warnings: string[] = [];
  const primaryAdapter = PRIMARY_BY_PLATFORM[input.platform];

  let primary: MarketIntelSignal | null = null;
  if (primaryAdapter) {
    primary = await primaryAdapter.fetch(query);
    if (primary.status !== "ok" && primary.message) warnings.push(primary.message);
  } else {
    warnings.push(
      `${input.platform} 暂无专用市场数据源；可结合 Google Trends 热度参考。`
    );
  }

  const trends = await googleTrendsAdapter.fetch(query);
  if (trends.status !== "ok" && trends.message) warnings.push(trends.message);

  return {
    platform: input.platform,
    category: input.category,
    country,
    primary,
    trends,
    warnings,
  };
}

export function getMarketIntelHealth() {
  return ADAPTERS.map((adapter) => ({
    provider: adapter.provider,
    configured: adapter.isConfigured(),
  }));
}

export type { MarketIntelSignal, MarketIntelAdapter } from "./types";
