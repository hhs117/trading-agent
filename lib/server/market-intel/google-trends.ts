import { ProxyAgent, type Dispatcher } from "undici";

import { payloadToSignal, readCachedSignal, writeCachedSignal } from "./cache";
import type { MarketIntelAdapter, MarketIntelQuery, MarketIntelSignal } from "./types";

const PROVIDER = "google-trends" as const;
const CACHE_TTL_MIN = 720;

let cachedDispatcher: Dispatcher | null | undefined;

function getProxyDispatcher(): Dispatcher | null {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxyUrl =
    process.env.GOOGLE_TRENDS_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    null;
  cachedDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : null;
  return cachedDispatcher;
}

const COUNTRY_TO_GEO: Record<string, string> = {
  ID: "ID",
  TH: "TH",
  VN: "VN",
  PH: "PH",
  MY: "MY",
  SG: "SG",
  TW: "TW",
  US: "US",
  GB: "GB",
  JP: "JP",
  KR: "KR",
};

type GoogleTrendsTimelineResponse = {
  default?: {
    timelineData?: Array<{
      time?: string;
      formattedTime?: string;
      value?: number[];
      formattedValue?: string[];
    }>;
    averages?: number[];
  };
};

function buildTrendsUrl(keyword: string, geo: string | null) {
  const req = {
    comparisonItem: [
      {
        keyword,
        geo: geo ?? "",
        time: "today 12-m",
      },
    ],
    category: 0,
    property: "",
  };

  const url = new URL("https://trends.google.com/trends/api/widgetdata/multiline");
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("tz", "0");
  url.searchParams.set("req", JSON.stringify(req));
  url.searchParams.set("token", "");
  return url;
}

async function fetchTimeline(keyword: string, geo: string | null): Promise<number[] | null> {
  const explore = new URL("https://trends.google.com/trends/api/explore");
  explore.searchParams.set("hl", "en-US");
  explore.searchParams.set("tz", "0");
  explore.searchParams.set(
    "req",
    JSON.stringify({
      comparisonItem: [{ keyword, geo: geo ?? "", time: "today 12-m" }],
      category: 0,
      property: "",
    })
  );

  const dispatcher = getProxyDispatcher();
  const fetchInit: RequestInit & { dispatcher?: Dispatcher } = { cache: "no-store" };
  if (dispatcher) fetchInit.dispatcher = dispatcher;

  const exploreRes = await fetch(explore, fetchInit);
  if (!exploreRes.ok) return null;
  const exploreText = await exploreRes.text();
  const stripped = exploreText.replace(/^\)\]\}',?\s*/, "");
  let exploreJson: { widgets?: Array<{ id?: string; token?: string; request?: unknown }> };
  try {
    exploreJson = JSON.parse(stripped);
  } catch {
    return null;
  }
  const widget = exploreJson.widgets?.find((item) => item.id === "TIMESERIES");
  if (!widget?.token || !widget.request) return null;

  const dataUrl = new URL("https://trends.google.com/trends/api/widgetdata/multiline");
  dataUrl.searchParams.set("hl", "en-US");
  dataUrl.searchParams.set("tz", "0");
  dataUrl.searchParams.set("req", JSON.stringify(widget.request));
  dataUrl.searchParams.set("token", widget.token);

  const dataRes = await fetch(dataUrl, fetchInit);
  if (!dataRes.ok) return null;
  const dataText = await dataRes.text();
  const dataStripped = dataText.replace(/^\)\]\}',?\s*/, "");
  let parsed: GoogleTrendsTimelineResponse;
  try {
    parsed = JSON.parse(dataStripped);
  } catch {
    return null;
  }

  const points = parsed.default?.timelineData ?? [];
  const values = points
    .map((point) => (Array.isArray(point.value) ? point.value[0] : null))
    .filter((value): value is number => typeof value === "number");
  return values.length ? values : null;
}

function deriveTrend(values: number[]): {
  index: number;
  yoy: number;
  direction: "up" | "down" | "stable";
} {
  const tail = values.slice(-12);
  const recent = tail.slice(-3);
  const earlier = tail.slice(0, 3);
  const avg = (list: number[]) => list.reduce((sum, value) => sum + value, 0) / list.length;
  const recentAvg = avg(recent);
  const earlierAvg = avg(earlier);
  const index = Math.round(recentAvg);
  if (!Number.isFinite(earlierAvg) || earlierAvg === 0) {
    return { index, yoy: 0, direction: "stable" };
  }
  const yoy = Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100);
  const direction = yoy >= 4 ? "up" : yoy <= -4 ? "down" : "stable";
  return { index, yoy, direction };
}

export const googleTrendsAdapter: MarketIntelAdapter = {
  provider: PROVIDER,

  supports() {
    return true;
  },

  isConfigured() {
    return process.env.MARKET_INTEL_ENABLE_GOOGLE_TRENDS !== "false";
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
      return { ...base, status: "unconfigured", message: "Google Trends 已被禁用" };
    }

    const cached = await readCachedSignal({
      platform: query.platform,
      category: query.category,
      country,
      provider: PROVIDER,
    });
    if (cached) return payloadToSignal(cached);

    const keyword = (query.keyword?.trim() || query.category).slice(0, 60);
    const geo = country ? COUNTRY_TO_GEO[country.toUpperCase()] ?? null : null;

    try {
      const values = await fetchTimeline(keyword, geo);
      if (!values) {
        return { ...base, status: "error", message: "Google Trends 未返回数据" };
      }

      const { index, yoy, direction } = deriveTrend(values);

      const signal: MarketIntelSignal = {
        ...base,
        status: "ok",
        trendIndex: index,
        trendYoy: yoy,
        trendDirection: direction,
        hotKeywords: [keyword],
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
        message: error instanceof Error ? error.message : "Google Trends 调用异常",
      };
    }
  },
};
