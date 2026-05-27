"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Globe,
  Loader2,
  Plug,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import StatCard from "@/components/ui/StatCard";
import { PRODUCT_CATEGORIES, formatShortNumber, formatUsd, type PlatformName } from "@/data/phase5";

type StorePerformance = {
  platform: string;
  storeCount: number;
  productCount: number;
  orderCount: number;
  totalGmvUsd: number | null;
  averagePriceUsd: number | null;
  orderCount30d: number;
  gmv30dUsd: number | null;
  orderCountPrev30d: number;
  gmvPrev30dUsd: number | null;
  topMarkets: Array<{ country: string; orderCount: number }>;
  lastSyncedAt: string | null;
};

type MarketIntelStatus = "ok" | "unconfigured" | "error";

type TopProductSignal = {
  externalId: string;
  title: string;
  price: number | null;
  monthlySales: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  detailUrl: string | null;
};

type MarketIntelSignal = {
  platform: PlatformName;
  category: string;
  country: string | null;
  provider: string;
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

type PlatformMarketIntel = {
  platform: PlatformName;
  category: string;
  country: string | null;
  primary: MarketIntelSignal | null;
  trends: MarketIntelSignal | null;
  warnings: string[];
};

type ProviderHealth = { provider: string; configured: boolean };

type MyPerformanceResponse = {
  ok: boolean;
  database: boolean;
  message?: string;
  rows: StorePerformance[];
};

type MarketSignalsResponse = {
  ok: boolean;
  message?: string;
  category: string;
  country: string | null;
  platforms: PlatformMarketIntel[];
  providers: ProviderHealth[];
};

const SUPPORTED_PLATFORMS: PlatformName[] = [
  "Shopee",
  "Lazada",
  "TikTok Shop",
  "Amazon",
  "Temu",
  "AliExpress",
];

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: "", label: "全部国家" },
  { code: "ID", label: "印尼" },
  { code: "TH", label: "泰国" },
  { code: "VN", label: "越南" },
  { code: "PH", label: "菲律宾" },
  { code: "MY", label: "马来西亚" },
  { code: "SG", label: "新加坡" },
  { code: "US", label: "美国" },
];

const PROVIDER_LABEL: Record<string, string> = {
  rainforest: "Rainforest (Amazon)",
  zhixia: "知虾 (Shopee/Lazada)",
  fastmoss: "FastMoss (TikTok Shop)",
  "google-trends": "Google Trends",
};

function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function trendIcon(direction: MarketIntelSignal["trendDirection"]) {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5 text-apple-green" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5 text-apple-red" />;
  return <BarChart3 className="h-3.5 w-3.5 text-apple-gray-300" />;
}

export default function AnalyticsPage() {
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [country, setCountry] = useState<string>("");

  const [performance, setPerformance] = useState<StorePerformance[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [databaseConfigured, setDatabaseConfigured] = useState<boolean>(true);

  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketPlatforms, setMarketPlatforms] = useState<PlatformMarketIntel[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);

  useEffect(() => {
    let cancelled = false;
    setPerformanceLoading(true);
    fetch("/api/analytics/my-performance", { cache: "no-store" })
      .then((res) => res.json() as Promise<MyPerformanceResponse>)
      .then((data) => {
        if (cancelled) return;
        setDatabaseConfigured(data.database);
        if (!data.ok && data.message) setPerformanceError(data.message);
        else setPerformanceError(null);
        setPerformance(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setPerformanceError(error instanceof Error ? error.message : "店铺数据加载失败");
      })
      .finally(() => {
        if (!cancelled) setPerformanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMarketLoading(true);
    const params = new URLSearchParams({ category });
    if (country) params.set("country", country);
    fetch(`/api/analytics/market-signals?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json() as Promise<MarketSignalsResponse>)
      .then((data) => {
        if (cancelled) return;
        if (!data.ok && data.message) setMarketError(data.message);
        else setMarketError(null);
        setMarketPlatforms(Array.isArray(data.platforms) ? data.platforms : []);
        setProviders(Array.isArray(data.providers) ? data.providers : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setMarketError(error instanceof Error ? error.message : "市场信号加载失败");
      })
      .finally(() => {
        if (!cancelled) setMarketLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, country]);

  const totalGmv = useMemo(
    () => performance.reduce((sum, row) => sum + (row.totalGmvUsd ?? 0), 0),
    [performance]
  );
  const totalOrders = useMemo(
    () => performance.reduce((sum, row) => sum + row.orderCount, 0),
    [performance]
  );
  const totalStores = useMemo(
    () => performance.reduce((sum, row) => sum + row.storeCount, 0),
    [performance]
  );
  const totalProducts = useMemo(
    () => performance.reduce((sum, row) => sum + row.productCount, 0),
    [performance]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="平台数据分析"
        badge="店铺真实数据 + 市场参考"
        description="上半部分基于你绑定的店铺真实订单/商品；下半部分通过第三方 API 与 Google Trends 提供市场参考。"
        action={
          <LinkButton href="/stores" iconRight={ArrowRight}>
            管理店铺绑定
          </LinkButton>
        }
      />

      {/* ============== 上半部：我的店铺真实表现 ============== */}
      <SectionCard
        title="我的店铺真实表现"
        description="按平台汇总当前所有已绑定店铺的订单和商品。所有数字直接来自数据库聚合，不存在演示数据。"
      >
        {performanceLoading ? (
          <LoadingRow text="正在从数据库聚合店铺数据..." />
        ) : !databaseConfigured ? (
          <EmptyState
            icon={Database}
            title="数据库未配置"
            description="DATABASE_URL 未填写，无法读取真实店铺数据。完成数据库配置后这里会自动展示聚合结果。"
          />
        ) : performanceError ? (
          <ErrorBlock title="加载失败" detail={performanceError} />
        ) : performance.length === 0 ? (
          <EmptyState
            icon={Store}
            title="还没有绑定任何店铺"
            description="去店铺管理页绑定 Shopee / TikTok Shop / Lazada 店铺，并完成首次同步后，这里会聚合显示真实数据。"
            actionHref="/stores"
            actionLabel="去绑定店铺"
          />
        ) : (
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="累计 GMV" value={formatUsd(totalGmv, 0)} icon={ShoppingCart} accent="blue" />
              <StatCard label="累计订单" value={formatShortNumber(totalOrders)} icon={BarChart3} accent="green" />
              <StatCard label="已绑定店铺" value={totalStores} icon={Store} accent="purple" />
              <StatCard label="同步商品" value={formatShortNumber(totalProducts)} accent="orange" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {performance.map((row) => {
                const gmvChange = pctChange(row.gmv30dUsd, row.gmvPrev30dUsd);
                const orderChange = pctChange(row.orderCount30d, row.orderCountPrev30d);
                return (
                  <div
                    key={row.platform}
                    className="rounded-2xl border border-apple-gray-100 bg-white p-5 shadow-card"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[16px] font-semibold text-apple-gray-900">{row.platform}</h3>
                        <div className="mt-1 text-[12px] text-apple-gray-300">
                          {row.storeCount} 个店铺 · {row.productCount} 件商品
                        </div>
                      </div>
                      {row.lastSyncedAt && (
                        <Badge tone="gray" size="sm">
                          同步于 {new Date(row.lastSyncedAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2.5 text-[13px]">
                      <Row label="累计 GMV">{row.totalGmvUsd === null ? "—" : formatUsd(row.totalGmvUsd, 0)}</Row>
                      <Row label="累计订单">{formatShortNumber(row.orderCount)}</Row>
                      <Row label="平均售价">
                        {row.averagePriceUsd === null ? "—" : formatUsd(row.averagePriceUsd)}
                      </Row>
                      <Row label="30 天 GMV">
                        <span className="flex items-center gap-1">
                          {row.gmv30dUsd === null ? "—" : formatUsd(row.gmv30dUsd, 0)}
                          {gmvChange !== null && (
                            <span
                              className={[
                                "tabular-nums",
                                gmvChange >= 0 ? "text-apple-green" : "text-apple-red",
                              ].join(" ")}
                            >
                              {gmvChange >= 0 ? "↑" : "↓"} {Math.abs(gmvChange)}%
                            </span>
                          )}
                        </span>
                      </Row>
                      <Row label="30 天订单">
                        <span className="flex items-center gap-1">
                          {formatShortNumber(row.orderCount30d)}
                          {orderChange !== null && (
                            <span
                              className={[
                                "tabular-nums",
                                orderChange >= 0 ? "text-apple-green" : "text-apple-red",
                              ].join(" ")}
                            >
                              {orderChange >= 0 ? "↑" : "↓"} {Math.abs(orderChange)}%
                            </span>
                          )}
                        </span>
                      </Row>
                    </div>

                    {row.topMarkets.length > 0 && (
                      <div className="mt-4 border-t border-apple-gray-100 pt-3">
                        <div className="mb-1.5 text-[11px] text-apple-gray-300">Top 买家国家</div>
                        <div className="flex flex-wrap gap-1.5">
                          {row.topMarkets.map((market) => (
                            <Badge key={market.country} tone="blue" size="sm">
                              {market.country} · {formatShortNumber(market.orderCount)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============== 下半部：市场参考信号 ============== */}
      <SectionCard
        title="市场参考信号"
        description="数据来自第三方 API 与 Google Trends。未配置的数据源会清晰标注，不会用演示数据混淆判断。"
      >
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[12px] text-apple-gray-300">类目</div>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={[
                    "rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    category === item
                      ? "border-apple-blue bg-apple-blue text-white"
                      : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[12px] text-apple-gray-300">国家</div>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="rounded-xl border border-apple-gray-100 bg-white px-3 py-1.5 text-[13px] text-apple-gray-900 focus:border-apple-blue focus:outline-none"
            >
              {COUNTRIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {providers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-apple-gray-300">数据源状态：</span>
              {providers.map((item) => (
                <Badge
                  key={item.provider}
                  tone={item.configured ? "green" : "gray"}
                  size="sm"
                >
                  <Plug className="mr-1 h-3 w-3" />
                  {PROVIDER_LABEL[item.provider] ?? item.provider}
                  {item.configured ? " · 已接" : " · 未配置"}
                </Badge>
              ))}
            </div>
          )}

          {marketError && <ErrorBlock title="市场数据加载失败" detail={marketError} />}

          {marketLoading ? (
            <LoadingRow text="正在调用各平台数据源..." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const intel = marketPlatforms.find((row) => row.platform === platform);
                if (!intel) return null;
                return <MarketIntelCard key={platform} intel={intel} />;
              })}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function MarketIntelCard({ intel }: { intel: PlatformMarketIntel }) {
  const { primary, trends, warnings } = intel;
  const hasPrimaryData = primary?.status === "ok";

  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-apple-gray-900">{intel.platform}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
            {primary && (
              <Badge
                tone={primary.status === "ok" ? "green" : primary.status === "unconfigured" ? "gray" : "red"}
                size="sm"
              >
                {PROVIDER_LABEL[primary.provider] ?? primary.provider}
              </Badge>
            )}
            {trends?.status === "ok" && (
              <Badge tone="blue" size="sm">
                <Globe className="mr-1 h-3 w-3" />
                Trends 已接
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasPrimaryData ? (
        <div className="space-y-2.5 text-[13px]">
          {primary?.averagePrice !== null && primary?.averagePrice !== undefined && (
            <Row label="平均售价">{formatUsd(primary.averagePrice)}</Row>
          )}
          {primary?.estimatedSales !== null && primary?.estimatedSales !== undefined && (
            <Row label="估算月销">{formatShortNumber(primary.estimatedSales)}</Row>
          )}
          {primary?.competitorCount !== null && primary?.competitorCount !== undefined && (
            <Row label="竞品数量">{formatShortNumber(primary.competitorCount)}</Row>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-apple-gray-50 px-3 py-2.5 text-[12px] text-apple-gray-300">
          {primary?.status === "unconfigured" && primary.message ? primary.message : "暂无主数据源数据"}
        </div>
      )}

      {trends?.status === "ok" && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-apple-gray-50 px-3 py-2 text-[12px]">
          <span className="text-apple-gray-300">Google Trends 热度</span>
          <span className="flex items-center gap-1.5">
            {trendIcon(trends.trendDirection)}
            <span className="font-medium text-apple-gray-900">
              {trends.trendIndex ?? "—"}
            </span>
            {trends.trendYoy !== null && trends.trendYoy !== undefined && (
              <span
                className={[
                  "tabular-nums",
                  trends.trendYoy >= 0 ? "text-apple-green" : "text-apple-red",
                ].join(" ")}
              >
                {trends.trendYoy >= 0 ? "+" : ""}
                {trends.trendYoy}%
              </span>
            )}
          </span>
        </div>
      )}

      {primary?.topProducts && primary.topProducts.length > 0 && (
        <div className="mt-3 border-t border-apple-gray-100 pt-3">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] text-apple-gray-300">
            <Sparkles className="h-3 w-3" /> Top 商品
          </div>
          <ul className="space-y-1.5">
            {primary.topProducts.slice(0, 3).map((product) => (
              <li key={product.externalId} className="text-[12px] leading-snug">
                {product.detailUrl ? (
                  <a
                    href={product.detailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-apple-blue hover:underline"
                  >
                    {product.title.slice(0, 60)}
                  </a>
                ) : (
                  <span>{product.title.slice(0, 60)}</span>
                )}
                {product.price !== null && (
                  <span className="ml-1 text-apple-gray-300">· {formatUsd(product.price)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-apple-gray-100 pt-3">
          {warnings.map((warning, index) => (
            <div key={index} className="text-[11px] leading-snug text-apple-gray-300">
              · {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-apple-gray-300">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1 text-right text-apple-gray-900">
        {children}
      </span>
    </div>
  );
}

function LoadingRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-10 text-[13px] text-apple-gray-300">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

function ErrorBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-apple-red/30 bg-apple-red/5 px-4 py-3 text-[13px] text-apple-red">
      <div className="font-semibold">{title}</div>
      <div className="mt-0.5 text-[12px] text-apple-red/80">{detail}</div>
    </div>
  );
}
