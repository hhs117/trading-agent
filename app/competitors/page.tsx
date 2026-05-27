"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lightbulb, MapPin, Search, Star, Swords, Trash2, TrendingUp } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  clearCompareItems,
  competitionLabel,
  formatUsd,
  getCompareItems,
  removeCompareItem,
  saveCompareItems,
  subscribeCompareItems,
  type CompetitionLevel,
  type CompetitorItem,
} from "@/data/phase5";
import { fetchApiCompareItems, saveApiCompareItems } from "@/lib/api/compareItems";

const COMPETITION_VALUE: Record<CompetitionLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function competitionTone(level: CompetitionLevel): "green" | "orange" | "red" {
  return level === "low" ? "green" : level === "medium" ? "orange" : "red";
}

function validNumbers(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null);
}

function formatOptionalMoney(value: number | null) {
  return value === null ? "暂无" : formatUsd(value);
}

function formatOptionalNumber(value: number | null) {
  return value === null ? "暂无" : value.toLocaleString();
}

export default function CompetitorsPage() {
  const [items, setItems] = useState<CompetitorItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      const remoteItems = await fetchApiCompareItems();
      if (!active) return;
      if (remoteItems) {
        saveCompareItems(remoteItems);
      }
      setItems(getCompareItems());
    }

    void loadItems();
    return subscribeCompareItems(() => setItems(getCompareItems()));
  }, []);

  const suggestions = useMemo(() => buildSuggestions(items), [items]);
  const pointMatrix = useMemo(() => buildPointMatrix(items), [items]);

  function handleRemove(id: string) {
    if (!confirm("确认从竞品对比中移除该商品？")) return;
    removeCompareItem(id);
    const nextItems = getCompareItems();
    setItems(nextItems);
    void saveApiCompareItems(nextItems);
  }

  function handleClear() {
    if (!confirm("确认清空所有竞品对比项？此操作不可恢复。")) return;
    clearCompareItems();
    setItems([]);
    void saveApiCompareItems([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Swords}
        title="竞品对比"
        badge={`${items.length} 个竞品`}
        description="展示已加入对比的竞品，支持价格、月销量、评论数、利润率、竞争强度、推荐指数和卖点横向比较。"
        action={
          items.length ? (
            <Button variant="secondary" icon={Trash2} onClick={handleClear}>
              清空对比
            </Button>
          ) : (
            <LinkButton href="/search-products" icon={Search}>
              去全网查品
            </LinkButton>
          )
        }
      />

      {items.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Swords}
            title="还没有加入对比的竞品"
            description="先去全网查品页面搜索商品，并点击「加入对比」。"
            actionHref="/search-products"
            actionLabel="去搜索竞品"
          />
        </SectionCard>
      ) : (
        <>
          <CompareTable items={items} onRemove={handleRemove} />

          <SectionCard title="竞品分析建议" description="系统根据当前对比组自动生成机会、风险和差异化方向。">
            {suggestions.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {suggestions.map((item) => {
                  const Icon = item.tone === "green" ? TrendingUp : item.tone === "blue" ? Lightbulb : AlertTriangle;
                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-apple-gray-100 bg-white p-4">
                      <div className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        item.tone === "green" ? "bg-apple-green/10 text-apple-green" : item.tone === "blue" ? "bg-apple-blue/10 text-apple-blue" : "bg-apple-orange/10 text-apple-orange",
                      ].join(" ")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold text-apple-gray-900">{item.title}</h3>
                        <p className="mt-1 text-[12px] leading-relaxed text-apple-gray-300">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="主要卖点矩阵" description="统计当前对比组中出现频次较高的卖点，帮助判断差异化空间。">
            <div className="flex flex-wrap gap-2">
              {pointMatrix.map((item) => (
                <Badge key={item.text} tone={item.count > 1 ? "blue" : "gray"}>
                  {item.text} x{item.count}
                </Badge>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function CompareTable({ items, onRemove }: { items: CompetitorItem[]; onRemove: (id: string) => void }) {
  const stats = useMemo(() => {
    const values = {
      price: validNumbers(items.map((item) => item.price)),
      monthlySales: validNumbers(items.map((item) => item.monthlySales)),
      reviewCount: validNumbers(items.map((item) => item.reviewCount)),
      profit: validNumbers(items.map((item) => item.estimatedProfitRate)),
      competition: items.map((item) => COMPETITION_VALUE[item.competition]),
      recommendation: validNumbers(items.map((item) => item.recommendationIndex)),
    };
    return {
      minPrice: values.price.length ? Math.min(...values.price) : null,
      maxMonthlySales: values.monthlySales.length ? Math.max(...values.monthlySales) : null,
      maxReviewCount: values.reviewCount.length ? Math.max(...values.reviewCount) : null,
      maxProfit: values.profit.length ? Math.max(...values.profit) : null,
      minCompetition: Math.min(...values.competition),
      maxRecommendation: values.recommendation.length ? Math.max(...values.recommendation) : null,
    };
  }, [items]);

  return (
    <SectionCard title="横向比较" description="左侧是对比维度，右侧每一列是一款竞品。" bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead>
            <tr className="border-b border-apple-gray-100">
              <th className="w-[140px] bg-apple-gray-50/60 px-5 py-4 text-left text-[12px] font-medium text-apple-gray-300">维度</th>
              {items.map((item) => (
                <th key={item.id} className="min-w-[220px] px-4 py-4 text-left align-top">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[13px] font-semibold normal-case text-apple-gray-900">{item.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] normal-case text-apple-gray-300">
                        <span>{item.platform}</span>
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {item.shippingFrom}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`移除 ${item.name}`}
                      onClick={() => onRemove(item.id)}
                      className="rounded-md p-1 text-apple-gray-300 hover:bg-apple-red/5 hover:text-apple-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-gray-100">
            <CompareRow label="价格">
              {items.map((item) => <BestCell key={item.id} active={item.price !== null && item.price === stats.minPrice} label="最低价">{formatOptionalMoney(item.price)}</BestCell>)}
            </CompareRow>
            <CompareRow label="月销量">
              {items.map((item) => <BestCell key={item.id} active={item.monthlySales !== null && item.monthlySales === stats.maxMonthlySales} label="最高销量">{formatOptionalNumber(item.monthlySales)}</BestCell>)}
            </CompareRow>
            <CompareRow label="评论数">
              {items.map((item) => <BestCell key={item.id} active={item.reviewCount !== null && item.reviewCount === stats.maxReviewCount} label="市场成熟">{formatOptionalNumber(item.reviewCount)}</BestCell>)}
            </CompareRow>
            <CompareRow label="评分">
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3 align-top">
                  <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-apple-gray-900">
                    {item.rating === null ? (
                      "暂无"
                    ) : (
                      <>
                        <Star className="h-3.5 w-3.5 fill-apple-orange text-apple-orange" />
                        {item.rating.toFixed(1)}
                      </>
                    )}
                  </span>
                </td>
              ))}
            </CompareRow>
            <CompareRow label="利润率">
              {items.map((item) => <BestCell key={item.id} active={item.estimatedProfitRate !== null && item.estimatedProfitRate === stats.maxProfit} label="利润最高">{item.estimatedProfitRate === null ? "暂无" : `${item.estimatedProfitRate}%`}</BestCell>)}
            </CompareRow>
            <CompareRow label="竞争强度">
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3 align-top">
                  <Badge tone={competitionTone(item.competition)}>{competitionLabel(item.competition)}</Badge>
                  {COMPETITION_VALUE[item.competition] === stats.minCompetition && <Badge tone="green" className="ml-1.5">压力较小</Badge>}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="推荐指数">
              {items.map((item) => <BestCell key={item.id} active={item.recommendationIndex !== null && item.recommendationIndex === stats.maxRecommendation} label="推荐最高">{item.recommendationIndex === null ? "暂无" : `${item.recommendationIndex}/10`}</BestCell>)}
            </CompareRow>
            <CompareRow label="主要卖点">
              {items.map((item) => (
                <td key={item.id} className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {item.sellingPoints.map((point) => <Badge key={point} tone="gray" size="sm">{point}</Badge>)}
                  </div>
                </td>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="bg-apple-gray-50/40 px-5 py-3 align-top text-[12.5px] font-medium text-apple-gray-900">{label}</td>
      {children}
    </tr>
  );
}

function BestCell({ active, label, children }: { active: boolean; label: string; children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 align-top">
      <span className={["font-semibold tabular-nums", active ? "text-apple-green" : "text-apple-gray-900"].join(" ")}>
        {children}
      </span>
      {active && <Badge tone="green" size="sm" className="ml-1.5">{label}</Badge>}
    </td>
  );
}

type Suggestion = {
  title: string;
  body: string;
  tone: "green" | "blue" | "orange";
};

function buildSuggestions(items: CompetitorItem[]): Suggestion[] {
  if (items.length === 0) return [];

  const suggestions: Suggestion[] = [];
  const prices = validNumbers(items.map((item) => item.price));
  const reviewCounts = validNumbers(items.map((item) => item.reviewCount));
  const profits = validNumbers(items.map((item) => item.estimatedProfitRate));
  const recommendations = items.filter((item) => item.recommendationIndex !== null);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const avgPrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null;
  const avgReviews = reviewCounts.length ? reviewCounts.reduce((sum, value) => sum + value, 0) / reviewCounts.length : null;
  const avgProfit = profits.length ? profits.reduce((sum, value) => sum + value, 0) / profits.length : null;
  const highCompetitionCount = items.filter((item) => item.competition === "high").length;
  const topPoints = buildPointMatrix(items).slice(0, 2).map((item) => item.text);

  if ((items.length > 1 && minPrice !== null && maxPrice !== null && avgPrice !== null && (maxPrice - minPrice) / avgPrice < 0.2) || highCompetitionCount >= Math.ceil(items.length / 2)) {
    suggestions.push({
      title: "价格竞争激烈，需要避开低价内卷",
      body:
        items.length > 1 && minPrice !== null && maxPrice !== null
          ? `当前对比组价格集中在 ${formatUsd(minPrice)} - ${formatUsd(maxPrice)}，且高竞争竞品较多，建议用材质、套装、场景图或售后承诺做差异化。`
          : "该竞品已处在高竞争区间，直接低价跟卖风险较高，建议从材质、套装、场景图或售后承诺做差异化。",
      tone: "orange",
    });
  }

  if (avgReviews !== null && avgReviews >= 2000) {
    suggestions.push({
      title: "评论数较多，市场成熟但竞争较强",
      body: `平均评论数约 ${Math.round(avgReviews).toLocaleString()}，说明买家教育充分，但新品需要更强首图和评价启动策略。`,
      tone: "orange",
    });
  }

  if (avgProfit !== null && avgProfit >= 25) {
    suggestions.push({
      title: "利润率较高，适合小批量测试",
      body: `平均预估利润率约 ${avgProfit.toFixed(0)}%，可以先用 100-300 件库存做小预算测试。`,
      tone: "green",
    });
  }

  if (topPoints.length) {
    suggestions.push({
      title: `卖点集中在 ${topPoints.join(" / ")}`,
      body: "如果竞品都在打便携、低价或基础功能，可以尝试做材质升级、组合装、礼盒包装或更本土化的使用场景。",
      tone: "blue",
    });
  }

  const best = recommendations.slice().sort((a, b) => (b.recommendationIndex ?? 0) - (a.recommendationIndex ?? 0))[0];
  if (best) {
    suggestions.push({
      title: `优先拆解 ${best.platform} 高推荐竞品`,
      body: `${best.name} 的推荐指数为 ${best.recommendationIndex}/10，建议重点拆解它的标题结构、主图卖点、价格带和评价关键词。`,
      tone: "blue",
    });
  }

  return suggestions.slice(0, 5);
}

function buildPointMatrix(items: CompetitorItem[]): { text: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    item.sellingPoints.forEach((point) => map.set(point, (map.get(point) ?? 0) + 1));
  });
  return Array.from(map.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);
}
