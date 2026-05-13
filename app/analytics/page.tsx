"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert, ShoppingCart, Tags, TrendingDown, TrendingUp, Users } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import ProgressBar from "@/components/ui/ProgressBar";
import SectionCard from "@/components/ui/SectionCard";
import {
  PLATFORMS,
  PRODUCT_CATEGORIES,
  fitLabel,
  formatShortNumber,
  formatUsd,
  riskLabel,
  type PlatformAnalytics,
} from "@/data/phase5";

type ScoredPlatform = {
  platform: PlatformAnalytics;
  score: number;
  reasons: string[];
};

function scorePlatform(platform: PlatformAnalytics, category: string): ScoredPlatform {
  let score = platform.fit === "high" ? 68 : platform.fit === "medium" ? 54 : 42;
  const reasons: string[] = [];

  const categoryScore = category ? platform.categoryBoost[category] ?? -4 : 0;
  score += categoryScore;
  if (category && categoryScore > 0) reasons.push(`${category} 是该平台的匹配类目`);
  if (category && categoryScore <= 0) reasons.push(`${category} 不是该平台主力类目`);

  if (platform.growthTrend.direction === "up") {
    score += Math.min(16, Math.round(platform.growthTrend.yoy / 4));
    reasons.push(`增长趋势 +${platform.growthTrend.yoy}%`);
  }
  if (platform.growthTrend.direction === "down") {
    score -= Math.min(12, Math.abs(platform.growthTrend.yoy));
    reasons.push(`增长趋势 ${platform.growthTrend.yoy}%`);
  }
  if (platform.risk === "high") score -= 12;
  if (platform.risk === "medium") score -= 4;
  if (platform.risk === "low") reasons.push("平台风险较低");

  return {
    platform,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.length ? reasons : ["综合适合度稳定", "可作为备选平台测试"],
  };
}

function toneByScore(score: number): "green" | "blue" | "orange" | "red" {
  if (score >= 78) return "green";
  if (score >= 62) return "blue";
  if (score >= 45) return "orange";
  return "red";
}

function fitTone(level: string): "green" | "orange" | "gray" {
  return level === "high" ? "green" : level === "medium" ? "orange" : "gray";
}

function riskTone(level: string): "green" | "orange" | "red" {
  return level === "low" ? "green" : level === "medium" ? "orange" : "red";
}

export default function AnalyticsPage() {
  const [category, setCategory] = useState("家居生活");
  const scored = useMemo(
    () => PLATFORMS.map((platform) => scorePlatform(platform, category)).sort((a, b) => b.score - a.score),
    [category]
  );
  const best = scored[0];
  const maxTrend = Math.max(...PLATFORMS.map((item) => Math.abs(item.growthTrend.yoy)));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="平台数据分析"
        badge="选品分析"
        description="按产品类目分析 Shopee、Lazada、TikTok Shop、Amazon、Temu、AliExpress 的平台机会、风险和适合度。"
        action={
          <LinkButton href="/search-products" iconRight={ArrowRight}>
            推荐：{best.platform.name}
          </LinkButton>
        }
      />

      <SectionCard title="选择产品类目" description="切换类目后，系统会重新计算平台适合度并给出选择建议。">
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
      </SectionCard>

      <div className="rounded-2xl bg-gradient-to-br from-apple-blue to-blue-500 p-5 text-white shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[12px] text-white/70">当前类目推荐平台</div>
            <h2 className="mt-1 text-[28px] font-semibold">{best.platform.name}</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/85">
              {best.reasons.join("；")}。建议以 {best.platform.name} 作为首发平台，备选平台为 {scored[1]?.platform.name}。
            </p>
          </div>
          <div className="shrink-0">
            <div className="text-[12px] text-white/70">推荐分</div>
            <div className="text-[44px] font-semibold leading-none">{best.score}<span className="text-[16px] text-white/70">/100</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scored.map(({ platform, score }) => (
          <div key={platform.name} className="rounded-2xl border border-apple-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold text-apple-gray-900">{platform.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={fitTone(platform.fit)} size="sm">适合度 {fitLabel(platform.fit)}</Badge>
                  <Badge tone={riskTone(platform.risk)} size="sm">{riskLabel(platform.risk)}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-apple-gray-300">推荐分</div>
                <div className="text-[24px] font-semibold tabular-nums text-apple-gray-900">{score}</div>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <InfoRow label="热门类目">
                <div className="flex max-w-[70%] flex-wrap justify-end gap-1">
                  {platform.hotCategories.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-md bg-apple-gray-50 px-1.5 py-0.5 text-[10.5px] text-apple-gray-300">
                      {item}
                    </span>
                  ))}
                </div>
              </InfoRow>
              <InfoRow label="平均售价">{formatUsd(platform.averagePrice)}</InfoRow>
              <InfoRow label="竞品数量"><Users className="h-3.5 w-3.5 text-apple-gray-300" />{formatShortNumber(platform.competitorCount)}</InfoRow>
              <InfoRow label="预估销量"><ShoppingCart className="h-3.5 w-3.5 text-apple-gray-300" />{formatShortNumber(platform.estimatedSales)}</InfoRow>
              <InfoRow label="增长趋势">
                {platform.growthTrend.direction === "up" ? <TrendingUp className="h-3.5 w-3.5 text-apple-green" /> : platform.growthTrend.direction === "down" ? <TrendingDown className="h-3.5 w-3.5 text-apple-red" /> : <BarChart3 className="h-3.5 w-3.5 text-apple-gray-300" />}
                <span className={platform.growthTrend.yoy > 0 ? "text-apple-green" : platform.growthTrend.yoy < 0 ? "text-apple-red" : "text-apple-gray-900"}>
                  {platform.growthTrend.yoy > 0 ? "+" : ""}{platform.growthTrend.yoy}% YoY
                </span>
              </InfoRow>
              <InfoRow label="风险提醒"><ShieldAlert className="h-3.5 w-3.5 text-apple-orange" />{riskLabel(platform.risk)}</InfoRow>
            </div>

            <div className="mt-4 border-t border-apple-gray-100 pt-4">
              <div className="mb-1.5 flex justify-between text-[11px] text-apple-gray-300">
                <span>适合度进度</span>
                <span>{score}%</span>
              </div>
              <ProgressBar value={score} tone={toneByScore(score)} />
            </div>

            <div className="mt-4">
              <div className="mb-1.5 text-[11px] text-apple-gray-300">适合产品类型</div>
              <div className="flex flex-wrap gap-1.5">
                {platform.suitableProducts.map((item) => (
                  <Badge key={item} tone="blue" size="sm">{item}</Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="趋势展示" description="增长越高，条形越长；下降平台会以红色标记。">
        <div className="space-y-3">
          {PLATFORMS.slice().sort((a, b) => b.growthTrend.yoy - a.growthTrend.yoy).map((platform) => {
            const width = maxTrend > 0 ? Math.abs(platform.growthTrend.yoy) / maxTrend * 100 : 0;
            return (
              <div key={platform.name} className="grid grid-cols-[110px_1fr_72px] items-center gap-3 text-[13px]">
                <span className="font-medium text-apple-gray-900">{platform.name}</span>
                <div className="h-3 rounded-full bg-apple-gray-100">
                  <div
                    className={["h-3 rounded-full", platform.growthTrend.yoy >= 0 ? "bg-apple-green" : "bg-apple-red"].join(" ")}
                    style={{ width: `${Math.max(6, width)}%` }}
                  />
                </div>
                <span className={["text-right tabular-nums", platform.growthTrend.yoy >= 0 ? "text-apple-green" : "text-apple-red"].join(" ")}>
                  {platform.growthTrend.yoy > 0 ? "+" : ""}{platform.growthTrend.yoy}%
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="平台选择建议" description="按类目、价格带、增长趋势和风险综合判断。">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            `首发建议：${best.platform.name}，它在「${category}」类目的匹配度最高。`,
            `备选建议：${scored[1]?.platform.name}，适合作为第二批测试平台。`,
            "低客单小件优先考虑 Shopee / Temu；强视觉爆款优先考虑 TikTok Shop。",
            "高客单、重合规和品牌化产品可以测试 Amazon，但要预留认证和评价成本。",
          ].map((item) => (
            <div key={item} className="flex gap-2 rounded-2xl border border-apple-gray-100 bg-white p-4 text-[13px] leading-relaxed text-apple-gray-900">
              <Tags className="mt-0.5 h-4 w-4 shrink-0 text-apple-blue" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/search-products" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-apple-blue hover:underline">
            去全网查品验证竞品 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-apple-gray-300">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1 text-right text-apple-gray-900">{children}</span>
    </div>
  );
}
