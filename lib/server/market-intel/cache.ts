import {
  getMarketSignalFromCache,
  isDatabaseConfigured,
  upsertMarketSignal,
  type PlatformMarketSignalRow,
} from "@/lib/server/database";
import type { MarketIntelProvider, MarketIntelSignal } from "./types";

export type CacheKey = {
  platform: string;
  category: string;
  country: string | null;
  provider: MarketIntelProvider;
};

export async function readCachedSignal(key: CacheKey): Promise<PlatformMarketSignalRow | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getMarketSignalFromCache(key);
  } catch {
    return null;
  }
}

export async function writeCachedSignal(
  key: CacheKey,
  signal: MarketIntelSignal,
  ttlMinutes: number
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  if (signal.status !== "ok") return;
  try {
    await upsertMarketSignal({
      platform: key.platform,
      category: key.category,
      country: key.country,
      provider: key.provider,
      payload: signal as unknown as Record<string, unknown>,
      fetchedAt: signal.fetchedAt,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    });
  } catch {
    // cache failure should never break the response
  }
}

export function payloadToSignal(row: PlatformMarketSignalRow): MarketIntelSignal {
  return {
    ...(row.payload as unknown as MarketIntelSignal),
    cached: true,
    fetchedAt: row.fetchedAt,
  };
}
