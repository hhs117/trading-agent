"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const PRODUCTS = [
  "便携式折叠收纳包",
  "智能宠物喂食器",
  "无线电竞鼠标",
  "真丝睡眠眼罩",
  "太阳能露营灯",
];

type OpsData = {
  exposure: number;
  ctr: number;
  conversionRate: number;
  favorites: number;
  cartAdds: number;
  refundRate: number;
  profitRate: number;
  adSpend: number;
  roi: number;
};

function buildOpsData(product: string): OpsData {
  const seed = product.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    exposure: 18000 + (seed % 8) * 4200,
    ctr: Number((1.6 + (seed % 5) * 0.45).toFixed(2)),
    conversionRate: Number((1.2 + (seed % 6) * 0.38).toFixed(2)),
    favorites: 120 + (seed % 9) * 36,
    cartAdds: 80 + (seed % 7) * 42,
    refundRate: Number((2.5 + (seed % 6) * 1.15).toFixed(2)),
    profitRate: Number((11 + (seed % 7) * 4.2).toFixed(2)),
    adSpend: 420 + (seed % 8) * 95,
    roi: Number((0.85 + (seed % 6) * 0.34).toFixed(2)),
  };
}

function getAdvice(data: OpsData) {
  const advice = [];
  if (data.ctr < 3) {
    advice.push({
      title: "点击率低",
      issue: "曝光能拿到，但用户没有被首屏吸引。",
      suggestion: "建议优化主图和标题，主图放大产品主体，标题前 35 个字符突出核心卖点。",
      tone: "orange" as const,
    });
  }
  if (data.conversionRate < 2.5) {
    advice.push({
      title: "转化率低",
      issue: "点击后下单不足，详情页承接和购买理由偏弱。",
      suggestion: "建议优化价格、评价、详情页，补充场景图、尺寸图、对比图和售后承诺。",
      tone: "red" as const,
    });
  }
  if (data.profitRate < 20) {
    advice.push({
      title: "利润率低",
      issue: "当前毛利空间不足，广告和退款会快速吃掉利润。",
      suggestion: "建议重新核算采购价、物流和平台佣金，优先谈供应价或调整组合装定价。",
      tone: "red" as const,
    });
  }
  if (data.refundRate > 6) {
    advice.push({
      title: "退款率高",
      issue: "售后风险偏高，可能存在预期不一致或质量波动。",
      suggestion: "建议检查产品描述、质量和售后，补充真实尺寸、材质说明和使用限制。",
      tone: "orange" as const,
    });
  }
  if (data.roi < 1.5) {
    advice.push({
      title: "ROI 低",
      issue: "广告投入回收不足，预算正在低效消耗。",
      suggestion: "建议调整广告关键词和预算，暂停低转化词，保留高收藏和高加购词。",
      tone: "orange" as const,
    });
  }
  if (!advice.length) {
    advice.push({
      title: "整体健康",
      issue: "当前漏斗表现较稳定，可以进入放量测试。",
      suggestion: "建议小幅增加预算，同时保留 A/B 主图和价格测试。",
      tone: "green" as const,
    });
  }
  return advice;
}

function adviceToText(product: string, data: OpsData) {
  return getAdvice(data)
    .map((item, index) => `${index + 1}. ${item.title}\n问题判断：${item.issue}\n优化建议：${item.suggestion}`)
    .join("\n\n")
    .concat(`\n\n产品：${product}`);
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
      <div className="text-[12px] text-apple-gray-300">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tabular-nums text-apple-gray-900">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-apple-gray-300">{sub}</div>}
    </div>
  );
}

export default function OptimizationPage() {
  const [product, setProduct] = useState(PRODUCTS[0]);
  const data = useMemo(() => buildOpsData(product), [product]);
  const advice = useMemo(() => getAdvice(data), [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Lightbulb}
        title="产品优化建议"
        badge="运营辅助"
        description="选择产品后展示 mock 运营数据，并根据点击率、转化率、利润率、退款率和 ROI 输出可执行建议。"
        action={<CopyTextButton text={adviceToText(product, data)} label="复制建议" />}
      />

      <SectionCard title="产品选择" description="当前数据为 mock 运营表现，用于验证优化判断逻辑。">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">选择产品</label>
            <select
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
            >
              {PRODUCTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <Button icon={Sparkles} onClick={() => setProduct(product)}>
            生成优化建议
          </Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="曝光量" value={data.exposure.toLocaleString()} sub="近 7 天" />
        <MetricCard label="点击率" value={`${data.ctr}%`} sub={data.ctr < 3 ? "低于健康线" : "表现正常"} />
        <MetricCard label="转化率" value={`${data.conversionRate}%`} sub={data.conversionRate < 2.5 ? "需要承接优化" : "可继续测试"} />
        <MetricCard label="收藏数" value={data.favorites.toString()} sub="有潜在兴趣" />
        <MetricCard label="加购数" value={data.cartAdds.toString()} sub="可做促单" />
        <MetricCard label="退款率" value={`${data.refundRate}%`} sub={data.refundRate > 6 ? "偏高" : "可控"} />
        <MetricCard label="利润率" value={`${data.profitRate}%`} sub={data.profitRate < 20 ? "偏低" : "健康"} />
        <MetricCard label="广告花费" value={`$${data.adSpend}`} sub="近 7 天" />
        <MetricCard label="ROI" value={data.roi.toString()} sub={data.roi < 1.5 ? "回收不足" : "可放量"} />
        <MetricCard label="综合风险" value={advice.some((item) => item.tone === "red") ? "高" : "中"} sub="按问题数量判断" />
      </div>

      <SectionCard title="问题判断与优化建议" description="按影响转化的优先级排列。">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {advice.map((item) => (
            <div key={item.title} className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.tone === "green" ? (
                    <TrendingUp className="h-4 w-4 text-apple-green" />
                  ) : item.tone === "red" ? (
                    <TrendingDown className="h-4 w-4 text-apple-red" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-apple-orange" />
                  )}
                  <h3 className="text-[14px] font-semibold text-apple-gray-900">{item.title}</h3>
                </div>
                <Badge tone={item.tone}>{item.tone === "green" ? "健康" : "待优化"}</Badge>
              </div>
              <div className="space-y-2 text-[13px] leading-relaxed text-apple-gray-900">
                <p>
                  <span className="font-medium">问题判断：</span>
                  {item.issue}
                </p>
                <p>
                  <span className="font-medium">优化建议：</span>
                  {item.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <CopyableBlock title="运营执行清单" text={adviceToText(product, data)}>
        <div className="space-y-2">
          {advice.map((item, index) => (
            <div key={item.title} className="flex gap-2">
              <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-apple-blue" />
              <span>
                {index + 1}. {item.suggestion}
              </span>
            </div>
          ))}
        </div>
      </CopyableBlock>
    </div>
  );
}
