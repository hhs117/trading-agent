"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Star,
  Rocket,
  Percent,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  Plus,
  ShoppingBag,
  PenLine,
  Calculator,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { LinkButton } from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";

import {
  getMockProducts,
  getMockPlatforms,
  STATUS_TONE,
  type MockProduct,
  type PlatformInfo,
} from "@/data/mockData";
import {
  computeOpportunityScore,
  computeProfit,
  isAtRisk,
  isHighPotential,
  needsOptimization,
  summarizeByPlatform,
  formatUsd,
  formatPct,
} from "@/data/derived";
import {
  ACTIVITY_META,
  formatRelativeTime,
  getActivityLog,
  type ActivityEntry,
  type ActivityType,
} from "@/data/activity";

/* ============================================================
 *  Activity icon mapping
 * ============================================================ */

const ACTIVITY_ICON: Record<ActivityType, typeof Plus> = {
  product_created: Plus,
  product_updated: PenLine,
  product_deleted: Trash2,
  scoring_completed: Star,
  copywriting_generated: PenLine,
  image_reviewed: ImageIcon,
  finance_calculated: Calculator,
};

/* ============================================================
 *  Page
 * ============================================================ */

export default function DashboardPage() {
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setProducts(getMockProducts());
    setPlatforms(getMockPlatforms());
    setActivity(getActivityLog());
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const scored = products.filter((p) => typeof p.totalScore === "number").length;
    const high = products.filter(isHighPotential).length;
    const needsOpt = products.filter(needsOptimization).length;
    const risk = products.filter(isAtRisk).length;

    const margins = products
      .filter((p) => p.salePrice > 0)
      .map((p) => computeProfit(p).margin);
    const avgMargin =
      margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;

    return { total, scored, high, needsOpt, risk, avgMargin };
  }, [products]);

  const opportunities = useMemo(() => {
    return [...products]
      .map((p) => ({ p, score: computeOpportunityScore(p) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [products]);

  const platformSummaryMap = useMemo(() => {
    const summary = summarizeByPlatform(products);
    return Object.fromEntries(summary.map((s) => [s.platform, s]));
  }, [products]);

  const aiSuggestions = useMemo(
    () => generateAISuggestions(products, platforms),
    [products, platforms]
  );

  if (products.length === 0) {
    return (
      <SectionCard title="数据看板">
        <EmptyState
          icon={Package}
          title="还没有产品数据"
          description="添加你的第一个待选品，体验全流程的选品评分、文案生成与利润测算。"
          actionHref="/products/new"
          actionLabel="新建产品"
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ===== Welcome row ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[12px] text-apple-gray-300 mb-1">运营总览</div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-apple-gray-900 tracking-tight">
            欢迎回来，今天的业务在向上跑 ↗
          </h1>
        </div>
        <LinkButton href="/products/new" icon={Plus} variant="primary">
          新建产品
        </LinkButton>
      </div>

      {/* ===== 6 stat cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard label="产品数量" value={stats.total} icon={Package} accent="blue" />
        <StatCard
          label="已评分产品"
          value={stats.scored}
          icon={Star}
          accent="purple"
          hint={`${Math.round((stats.scored / stats.total) * 100)}% 覆盖`}
        />
        <StatCard label="高潜力产品" value={stats.high} icon={Rocket} accent="green" />
        <StatCard
          label="平均利润率"
          value={formatPct(stats.avgMargin, 1)}
          icon={Percent}
          accent={stats.avgMargin >= 0.3 ? "green" : stats.avgMargin >= 0.15 ? "orange" : "red"}
        />
        <StatCard
          label="待优化商品"
          value={stats.needsOpt}
          icon={Lightbulb}
          accent="orange"
        />
        <StatCard
          label="风险提醒"
          value={stats.risk}
          icon={AlertTriangle}
          accent={stats.risk > 0 ? "red" : "gray"}
        />
      </div>

      {/* ===== Opportunity ranking + activity feed ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard
          className="lg:col-span-2"
          title="产品机会榜"
          description="按综合机会分排序，分越高越值得加大投入。"
          action={
            <Link
              href="/products"
              className="text-[12.5px] text-apple-blue hover:underline inline-flex items-center gap-0.5"
            >
              查看全部 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-apple-gray-100">
            {opportunities.map((o, i) => {
              const p = o.p;
              const { margin } = computeProfit(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-apple-gray-50/60 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-apple-gray-50 text-apple-gray-300 flex items-center justify-center text-[12px] font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="text-[13.5px] font-medium text-apple-gray-900 truncate">
                          {p.name}
                        </div>
                        <Badge tone={STATUS_TONE[p.status]} size="sm">
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-[11.5px] text-apple-gray-300 truncate">
                        {p.platform} · {p.category} · ★ {p.rating.toFixed(1)} · 月销 {p.monthlySales.toLocaleString()}
                      </div>
                      <div className="mt-1.5 max-w-xs">
                        <ProgressBar
                          value={o.score}
                          tone={o.score >= 70 ? "green" : o.score >= 50 ? "blue" : "orange"}
                        />
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                      <div className="text-[18px] font-semibold text-apple-gray-900 tabular-nums leading-none">
                        {o.score}
                      </div>
                      <div className="text-[11px] text-apple-gray-300 mt-1">
                        毛利 {formatPct(margin, 0)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="最近操作"
          description="近期的选品、评分、文案与利润动作。"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-apple-gray-100">
            {activity.slice(0, 7).map((a) => {
              const Icon = ACTIVITY_ICON[a.type];
              const meta = ACTIVITY_META[a.type];
              return (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center",
                        toneBgFg(meta.tone),
                      ].join(" ")}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12.5px] font-medium text-apple-gray-900">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-apple-gray-300">
                          {formatRelativeTime(a.timestamp)}
                        </span>
                      </div>
                      {a.productName &&
                        (a.productId ? (
                          <Link
                            href={`/products/${a.productId}`}
                            className="text-[12px] text-apple-gray-900 hover:text-apple-blue transition truncate block"
                          >
                            {a.productName}
                          </Link>
                        ) : (
                          <div className="text-[12px] text-apple-gray-900 truncate">
                            {a.productName}
                          </div>
                        ))}
                      {a.detail && (
                        <div className="text-[11.5px] text-apple-gray-300 mt-0.5 leading-relaxed">
                          {a.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      {/* ===== Platform performance grid ===== */}
      <SectionCard
        title="平台表现概览"
        description="自家 SKU 在六大平台的分布、销量、毛利与趋势。"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {platforms.map((pf) => {
            const own = platformSummaryMap[pf.platformName];
            return <PlatformCard key={pf.platformName} platform={pf} own={own} />;
          })}
        </div>
      </SectionCard>

      {/* ===== AI suggestions ===== */}
      <SectionCard
        title="AI 运营建议"
        description="基于当前选品与平台数据，给出可执行的下一步动作。"
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiSuggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={i}
                className="p-4 rounded-2xl bg-apple-gray-50/60 border border-apple-gray-100 flex items-start gap-3"
              >
                <div className={["w-8 h-8 rounded-xl flex items-center justify-center shrink-0", toneBgFg(s.tone)].join(" ")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-apple-gray-900 mb-1">
                    {s.title}
                  </div>
                  <div className="text-[12.5px] text-apple-gray-300 leading-relaxed">
                    {s.body}
                  </div>
                  {s.action && (
                    <Link
                      href={s.action.href}
                      className="inline-flex items-center gap-0.5 text-[12px] text-apple-blue hover:underline mt-2"
                    >
                      {s.action.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}

/* ============================================================
 *  PlatformCard sub-component
 * ============================================================ */

function PlatformCard({
  platform,
  own,
}: {
  platform: PlatformInfo;
  own?: {
    skuCount: number;
    monthlyUnits: number;
    monthlyProfitUsd: number;
    avgRating: number;
    recommendedCount: number;
  };
}) {
  const trend = platform.growthTrend;
  const TrendIcon = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const trendTone =
    trend.direction === "up"
      ? "text-apple-green"
      : trend.direction === "down"
      ? "text-apple-red"
      : "text-apple-gray-300";

  const fitTone = platform.platformFit === "high" ? "green" : platform.platformFit === "medium" ? "orange" : "gray";
  const riskTone = platform.riskLevel === "low" ? "green" : platform.riskLevel === "medium" ? "orange" : "red";

  return (
    <div className="bg-white rounded-2xl border border-apple-gray-100 p-4 sm:p-5 hover:shadow-card transition">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-apple-gray-900">{platform.platformName}</div>
          <div className="text-[11.5px] text-apple-gray-300 mt-0.5">
            平台均价 {formatUsd(platform.averagePrice)} · 卖家 {formatNumberShort(platform.competitorCount)}
          </div>
        </div>
        <div className={["inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums", trendTone].join(" ")}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trend.direction === "stable" ? "持平" : `${trend.yoy > 0 ? "+" : ""}${trend.yoy}%`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <KvRow label="自有 SKU" value={own ? `${own.skuCount} 款` : "—"} />
        <KvRow label="月销量合计" value={own ? own.monthlyUnits.toLocaleString() : "—"} />
        <KvRow label="月毛利估算" value={own ? formatUsd(own.monthlyProfitUsd, 0) : "—"} />
        <KvRow label="店铺均评分" value={own ? `★ ${own.avgRating.toFixed(2)}` : "—"} />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge tone={fitTone} size="sm">
          适配 {fitLabel(platform.platformFit)}
        </Badge>
        <Badge tone={riskTone} size="sm">
          风险 {riskLabel(platform.riskLevel)}
        </Badge>
      </div>
    </div>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-apple-gray-300">{label}</div>
      <div className="text-[13px] font-medium text-apple-gray-900 tabular-nums truncate">{value}</div>
    </div>
  );
}

/* ============================================================
 *  AI suggestion synthesis
 * ============================================================ */

interface AISuggestion {
  title: string;
  body: string;
  icon: typeof Sparkles;
  tone: "blue" | "green" | "orange" | "red" | "purple" | "gray";
  action?: { href: string; label: string };
}

function generateAISuggestions(
  products: MockProduct[],
  platforms: PlatformInfo[]
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // 1. category leader
  const byCategory = new Map<string, number>();
  products.filter(isHighPotential).forEach((p) => {
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
  });
  const topCategory = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] >= 2) {
    suggestions.push({
      title: `「${topCategory[0]}」是当前增长锚`,
      body: `已有 ${topCategory[1]} 款高潜商品来自该品类，建议把下个月广告预算向「${topCategory[0]}」倾斜 10-15%，并扩展同品类长尾 SKU。`,
      icon: Rocket,
      tone: "green",
      action: { href: "/analytics", label: "查看平台数据分析" },
    });
  }

  // 2. fastest growing platform
  const upPlatforms = platforms
    .filter((p) => p.growthTrend.direction === "up")
    .sort((a, b) => b.growthTrend.yoy - a.growthTrend.yoy);
  if (upPlatforms.length > 0) {
    const pf = upPlatforms[0];
    suggestions.push({
      title: `${pf.platformName} 同比 +${pf.growthTrend.yoy}%，可以加注`,
      body: `平台均价 ${formatUsd(pf.averagePrice)}，主力热门类目包括 ${pf.hotCategories
        .slice(0, 3)
        .join(" / ")}。建议筛选自有 SKU 中匹配的款式优先铺货。`,
      icon: TrendingUp,
      tone: "blue",
      action: { href: "/listing", label: "去上品辅助" },
    });
  }

  // 3. optimization
  const needsOpt = products.filter(needsOptimization);
  if (needsOpt.length > 0) {
    suggestions.push({
      title: `${needsOpt.length} 款商品需要优化`,
      body: `评分偏低或仍在测试中的商品集中在 ${distinctCategories(needsOpt)}。建议先做主图本地化与详情卖点重组，跑一轮 7 天测试再决定加减预算。`,
      icon: Lightbulb,
      tone: "orange",
      action: { href: "/optimization", label: "查看优化建议" },
    });
  }

  // 4. risk
  const atRisk = products.filter(isAtRisk);
  if (atRisk.length > 0) {
    suggestions.push({
      title: `${atRisk.length} 款商品存在风险`,
      body: `包含缺货、下架以及评分异常的 SKU。请优先与供应商对齐补货周期，避免广告投放打到已下架链接造成预算浪费。`,
      icon: AlertTriangle,
      tone: "red",
      action: { href: "/products?status=缺货", label: "立即处理" },
    });
  }

  // 5. fallback when everything looks fine
  if (suggestions.length === 0) {
    suggestions.push({
      title: "整体表现稳健",
      body: "所有商品都在健康区间。可以把精力转向横向扩品和多语言文案生成，提升单 SKU 的国家覆盖度。",
      icon: Sparkles,
      tone: "blue",
      action: { href: "/copywriting", label: "去生成文案" },
    });
  }

  return suggestions.slice(0, 4);
}

function distinctCategories(list: MockProduct[]): string {
  const set = new Set(list.map((p) => p.category));
  return Array.from(set).slice(0, 3).join(" / ");
}

/* ============================================================
 *  Utility helpers (local, page-scoped)
 * ============================================================ */

function fitLabel(f: "high" | "medium" | "low"): string {
  return f === "high" ? "高" : f === "medium" ? "中" : "低";
}

function riskLabel(r: "low" | "medium" | "high"): string {
  return r === "low" ? "低" : r === "medium" ? "中" : "高";
}

function toneBgFg(tone: "blue" | "green" | "orange" | "red" | "purple" | "gray"): string {
  return {
    blue: "bg-apple-blue/10 text-apple-blue",
    green: "bg-apple-green/10 text-apple-green",
    orange: "bg-apple-orange/10 text-apple-orange",
    red: "bg-apple-red/10 text-apple-red",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-apple-gray-100 text-apple-gray-300",
  }[tone];
}

function formatNumberShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// silence unused-import warning while keeping the symbol available
void ShoppingBag;
