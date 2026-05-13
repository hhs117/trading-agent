"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Star,
  Package2,
  Coins,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Grid3x3,
  Swords,
  Languages,
  Wand2,
  Calculator,
  ChevronRight,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import RecommendationBadge from "@/components/RecommendationBadge";

import {
  deleteMockProduct,
  getMockProductById,
  getMockProducts,
  upsertMockProduct,
  MOCK_MARKET_LABELS,
  STATUS_TONE,
  type MockProduct,
} from "@/data/mockData";
import { computeOpportunityScore, computeProfit, formatPct, formatUsd } from "@/data/derived";
import { logActivity } from "@/data/activity";
import {
  SCORE_DIMENSION_LABELS,
  type ScoreDimensions,
} from "@/lib/types";
import { RECOMMENDATION_META } from "@/lib/scoring";

import ScoringTab from "./ScoringTab";
import CopywritingTab from "./CopywritingTab";
import ImageReviewTab from "./ImageReviewTab";
import { deleteApiProduct, fetchApiProduct } from "@/lib/api/products";

type TabKey = "scoring" | "copywriting" | "images";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "scoring", label: "九宫格评分" },
  { key: "copywriting", label: "多语言文案" },
  { key: "images", label: "图片审查" },
];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<MockProduct | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>("scoring");
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      const remoteProduct = await fetchApiProduct(params.id);
      if (!active) return;

      if (remoteProduct !== undefined) {
        if (remoteProduct) upsertMockProduct(remoteProduct);
        setProduct(remoteProduct);
      } else {
        setProduct(getMockProductById(params.id) ?? null);
      }
      setLoaded(true);
    }

    void loadProduct();
    return () => {
      active = false;
    };
  }, [params.id]);

  async function refresh() {
    const remoteProduct = await fetchApiProduct(params.id);
    if (remoteProduct !== undefined) {
      if (remoteProduct) upsertMockProduct(remoteProduct);
      setProduct(remoteProduct);
      return;
    }

    setProduct(getMockProductById(params.id) ?? null);
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`确认删除「${product.name}」？此操作不可撤销。`)) return;
    await deleteApiProduct(product.id);
    deleteMockProduct(product.id);
    logActivity({
      type: "product_deleted",
      productId: product.id,
      productName: product.name,
    });
    router.push("/products");
  }

  function scrollToTab(target: TabKey) {
    setTab(target);
    setTimeout(() => {
      toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  if (!loaded) {
    return <div className="text-apple-gray-300 text-[13px]">加载中…</div>;
  }

  if (!product) {
    return (
      <SectionCard>
        <div className="py-16 text-center">
          <div className="text-[15px] font-semibold text-apple-gray-900 mb-2">
            未找到该产品
          </div>
          <div className="text-[13px] text-apple-gray-300 mb-5">
            可能已被删除，或链接已失效。
          </div>
          <Link href="/products" className="text-apple-blue text-[13px]">
            返回产品库 →
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-[13px] text-apple-gray-300 hover:text-apple-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回产品库
      </Link>

      <PageHeader
        icon={Package2}
        title={product.name}
        description={`${product.platform} · ${product.category} · ID ${product.id}`}
        badge={product.status}
        action={
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-[13px] text-apple-red hover:bg-apple-red/5 transition px-3 py-1.5 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
            删除产品
          </button>
        }
      />

      {/* === Overview row: basic info + price card === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <BasicInfoCard product={product} />
        <PriceCard product={product} className="lg:col-span-2" />
      </div>

      {/* === Quick entries === */}
      <QuickEntries productId={product.id} onScrollToTab={scrollToTab} />

      {/* === Scoring summary + AI suggestions === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ScoringSummary
          product={product}
          onScoreClick={() => scrollToTab("scoring")}
          className="lg:col-span-2"
        />
        <OpsSuggestions product={product} />
      </div>

      {/* === Working tools (preserves Phase-1 functionality) === */}
      <div ref={toolsRef} />
      <SectionCard
        title="工作区"
        description="九宫格评分、多语言文案与图片审查的实际操作面板。"
        action={
          <div className="flex bg-apple-gray-50 rounded-xl p-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  "px-3.5 py-1.5 text-[12px] rounded-lg transition whitespace-nowrap",
                  tab === t.key
                    ? "bg-white text-apple-gray-900 shadow-soft font-medium"
                    : "text-apple-gray-300 hover:text-apple-gray-900",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        {tab === "scoring" && <ScoringTab product={product} onUpdated={refresh} />}
        {tab === "copywriting" && <CopywritingTab product={product} onUpdated={refresh} />}
        {tab === "images" && <ImageReviewTab product={product} onUpdated={refresh} />}
      </SectionCard>
    </div>
  );
}

/* ============================================================
 *  Basic Info card
 * ============================================================ */

function BasicInfoCard({ product }: { product: MockProduct }) {
  return (
    <SectionCard title="基本信息">
      <div className="flex gap-4 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-apple-gray-50 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Badge tone={STATUS_TONE[product.status]} size="sm" className="mb-2">
            {product.status}
          </Badge>
          <div className="text-[12.5px] text-apple-gray-300 mb-1">供应商</div>
          <div className="text-[13px] text-apple-gray-900 truncate">
            {product.supplier || "未填写"}
          </div>
          {product.supplierUrl && (
            <a
              href={product.supplierUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] text-apple-blue hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" /> 打开供应商链接
            </a>
          )}
        </div>
      </div>

      <dl className="space-y-2 text-[13px]">
        <KvLine label="目标市场">
          <div className="flex flex-wrap gap-1">
            {product.targetMarket.map((m) => (
              <span
                key={m}
                className="text-[11px] bg-apple-gray-50 text-apple-gray-300 rounded-md px-1.5 py-0.5"
              >
                {MOCK_MARKET_LABELS[m] ?? m}
              </span>
            ))}
          </div>
        </KvLine>
        <KvLine label="月销量">{product.monthlySales.toLocaleString()} 件</KvLine>
        <KvLine label="评分">
          <span className="inline-flex items-center gap-0.5 text-apple-gray-900">
            <Star className="w-3.5 h-3.5 text-apple-orange fill-apple-orange" />
            {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
          </span>
        </KvLine>
        <KvLine label="库存">
          {product.stock !== undefined ? `${product.stock.toLocaleString()} 件` : "—"}
        </KvLine>
        <KvLine label="创建时间">
          {new Date(product.createdAt).toLocaleDateString("zh-CN")}
        </KvLine>
      </dl>

      {product.notes && (
        <div className="mt-4 pt-4 border-t border-apple-gray-100">
          <div className="text-[12px] text-apple-gray-300 mb-1.5">备注</div>
          <div className="text-[12.5px] text-apple-gray-900 leading-relaxed whitespace-pre-line">
            {product.notes}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ============================================================
 *  Price card (cost / sale / profit / margin)
 * ============================================================ */

function PriceCard({
  product,
  className = "",
}: {
  product: MockProduct;
  className?: string;
}) {
  const { unitCostUsd, commissionUsd, profitUsd, margin, monthlyProfitUsd } = computeProfit(product);
  const marginTone =
    margin >= 0.4 ? "text-apple-green" : margin >= 0.2 ? "text-apple-orange" : "text-apple-red";

  const breakdown = [
    { label: "建议售价", value: formatUsd(product.salePrice), tone: "text-apple-gray-900" },
    { label: "单件成本", value: `-${formatUsd(unitCostUsd)}`, tone: "text-apple-red" },
    { label: "平台佣金", value: `-${formatUsd(commissionUsd)}`, tone: "text-apple-red" },
  ];

  return (
    <SectionCard title="价格 · 成本 · 利润率" className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <PriceCell label="采购价" value={`¥${product.costPrice.toFixed(2)}`} sub="CNY / 件" />
        <PriceCell label="运费" value={`¥${product.shippingCost.toFixed(2)}`} sub="CNY / 件" />
        <PriceCell label="售价" value={formatUsd(product.salePrice)} sub="USD / 件" />
        <PriceCell
          label="毛利率"
          value={formatPct(margin, 1)}
          valueClass={marginTone}
          sub={`单件 ${formatUsd(profitUsd)}`}
        />
      </div>

      <div className="rounded-2xl bg-apple-gray-50/60 border border-apple-gray-100 p-4">
        <div className="text-[12px] text-apple-gray-300 mb-3">利润瀑布（单件，USD）</div>
        <div className="space-y-1.5">
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-[13px]">
              <span className="text-apple-gray-300">{b.label}</span>
              <span className={["tabular-nums font-medium", b.tone].join(" ")}>{b.value}</span>
            </div>
          ))}
          <div className="h-px bg-apple-gray-100 my-2" />
          <div className="flex justify-between text-[14px]">
            <span className="text-apple-gray-900 font-medium">单件利润</span>
            <span className={["tabular-nums font-semibold", marginTone].join(" ")}>
              {formatUsd(profitUsd)}
            </span>
          </div>
          <div className="flex justify-between text-[12px] text-apple-gray-300">
            <span>按当前月销估算月利润</span>
            <span className="tabular-nums">{formatUsd(monthlyProfitUsd, 0)}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PriceCell({
  label,
  value,
  sub,
  valueClass = "text-apple-gray-900",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-apple-gray-50/60 rounded-xl p-3.5">
      <div className="text-[11px] text-apple-gray-300 mb-1">{label}</div>
      <div className={["text-[18px] font-semibold tabular-nums leading-none", valueClass].join(" ")}>
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-apple-gray-300 mt-1.5">{sub}</div>}
    </div>
  );
}

function KvLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-apple-gray-300 shrink-0">{label}</dt>
      <dd className="text-right text-apple-gray-900 min-w-0">{children}</dd>
    </div>
  );
}

/* ============================================================
 *  Scoring summary (display only — editing happens in the Tools tab)
 * ============================================================ */

function ScoringSummary({
  product,
  onScoreClick,
  className = "",
}: {
  product: MockProduct;
  onScoreClick: () => void;
  className?: string;
}) {
  const radarData = useMemo(() => {
    if (!product.score) return [];
    return (Object.keys(SCORE_DIMENSION_LABELS) as Array<keyof ScoreDimensions>).map((k) => ({
      dimension: SCORE_DIMENSION_LABELS[k],
      value: product.score![k],
    }));
  }, [product.score]);

  return (
    <SectionCard
      title="评分结果"
      description={product.score ? "九宫格综合评估的当前结果。" : "尚未完成评分。"}
      action={
        <button
          onClick={onScoreClick}
          className="text-[12.5px] text-apple-blue hover:underline inline-flex items-center gap-0.5"
        >
          {product.score ? "重新评分" : "开始评分"}{" "}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      }
      className={className}
    >
      {!product.score || product.totalScore === undefined || !product.recommendation ? (
        <div className="text-[13px] text-apple-gray-300 py-2">
          点击右上角「开始评分」打开九宫格滑块面板，完成评分后会自动写入这里。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-5">
          {/* Total + recommendation + breakdown */}
          <div className="space-y-4">
            <div>
              <div className="text-[12px] text-apple-gray-300 mb-1">综合评分</div>
              <div className="flex items-baseline gap-2">
                <div className="text-[40px] font-semibold text-apple-gray-900 tracking-tight leading-none">
                  {product.totalScore.toFixed(1)}
                </div>
                <div className="text-[14px] text-apple-gray-300">/ 10</div>
              </div>
              <div className="mt-3">
                <RecommendationBadge recommendation={product.recommendation} />
              </div>
              <div className="text-[12px] text-apple-gray-300 mt-2 leading-relaxed">
                {RECOMMENDATION_META[product.recommendation].tip}
              </div>
            </div>

            <div className="space-y-2">
              {(Object.keys(SCORE_DIMENSION_LABELS) as Array<keyof ScoreDimensions>).map((k) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-[11.5px] text-apple-gray-300 mb-0.5">
                    <span>{SCORE_DIMENSION_LABELS[k]}</span>
                    <span className="tabular-nums text-apple-gray-900">{product.score![k]}/10</span>
                  </div>
                  <ProgressBar
                    value={product.score![k]}
                    max={10}
                    tone={
                      product.score![k] >= 8
                        ? "green"
                        : product.score![k] >= 5
                        ? "blue"
                        : "orange"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Radar */}
          <div className="bg-apple-gray-50/60 rounded-2xl p-4">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#D2D2D7" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#86868B" }} />
                  <Radar dataKey="value" stroke="#0071E3" fill="#0071E3" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ============================================================
 *  Ops suggestions (computed live from MockProduct state)
 * ============================================================ */

function OpsSuggestions({ product }: { product: MockProduct }) {
  const suggestions = useMemo(() => buildSuggestions(product), [product]);
  return (
    <SectionCard
      title="运营建议"
      description="基于当前评分、毛利与状态自动生成。"
    >
      {suggestions.length === 0 ? (
        <div className="text-[13px] text-apple-gray-300 py-4 text-center">
          目前一切正常，可以保持现有策略。
        </div>
      ) : (
        <ul className="space-y-2.5">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-apple-gray-50/60 border border-apple-gray-100"
              >
                <div
                  className={[
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    toneBg(s.tone),
                  ].join(" ")}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-apple-gray-900">{s.title}</div>
                  <div className="text-[11.5px] text-apple-gray-300 mt-0.5 leading-relaxed">
                    {s.body}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

interface Suggestion {
  title: string;
  body: string;
  icon: typeof Lightbulb;
  tone: "green" | "blue" | "orange" | "red";
}

function buildSuggestions(p: MockProduct): Suggestion[] {
  const list: Suggestion[] = [];
  const { margin } = computeProfit(p);
  const opp = computeOpportunityScore(p);

  if (p.status === "缺货") {
    list.push({
      title: "立即跟进补货",
      body: "当前状态为缺货，建议优先联系供应商对齐到货时间，并暂停在售平台广告投放。",
      icon: AlertTriangle,
      tone: "red",
    });
  }
  if (margin < 0.2 && p.salePrice > 0) {
    list.push({
      title: "毛利率偏低",
      body: `当前毛利率 ${(margin * 100).toFixed(1)}%，建议优化采购成本或拉升售价 5-10%，预留广告预算。`,
      icon: Coins,
      tone: "orange",
    });
  }
  if (p.rating > 0 && p.rating < 4.5) {
    list.push({
      title: "用户评分需要优化",
      body: `平均评分 ${p.rating.toFixed(1)}，建议拉取近 30 天差评关键词，先解决排名前 3 的痛点。`,
      icon: Lightbulb,
      tone: "orange",
    });
  }
  if (p.recommendation === "recommend" && p.monthlySales < 2000) {
    list.push({
      title: "评分高但销量未释放",
      body: "九宫格已给出推荐结论，但月销低于 2000。建议加大短视频投流并补充 3-5 张本地化主图。",
      icon: TrendingUp,
      tone: "blue",
    });
  }
  if (opp >= 70) {
    list.push({
      title: "进入加投窗口",
      body: `综合机会分 ${opp}，处于绿色区间。建议本周内启动多语言文案生成 + 投流策略升级。`,
      icon: TrendingUp,
      tone: "green",
    });
  }
  if (!p.score) {
    list.push({
      title: "尚未完成九宫格评分",
      body: "在下方工作区滑动 9 个维度可一分钟完成评分，得到推荐结论与权重化总分。",
      icon: Lightbulb,
      tone: "blue",
    });
  }

  return list.slice(0, 4);
}

function toneBg(tone: "green" | "blue" | "orange" | "red"): string {
  return {
    green: "bg-apple-green/10 text-apple-green",
    blue: "bg-apple-blue/10 text-apple-blue",
    orange: "bg-apple-orange/10 text-apple-orange",
    red: "bg-apple-red/10 text-apple-red",
  }[tone];
}

/* ============================================================
 *  Quick entries
 * ============================================================ */

function QuickEntries({
  productId,
  onScrollToTab,
}: {
  productId: string;
  onScrollToTab: (k: TabKey) => void;
}) {
  const entries = [
    {
      icon: Grid3x3,
      label: "九宫格评分",
      desc: "九维滑块快速打分",
      action: () => onScrollToTab("scoring"),
      tone: "blue" as const,
    },
    {
      icon: Swords,
      label: "竞品对比",
      desc: "并排参数对比",
      href: `/competitors?productId=${productId}`,
      tone: "purple" as const,
    },
    {
      icon: Languages,
      label: "多语言文案",
      desc: "五种东南亚语言",
      action: () => onScrollToTab("copywriting"),
      tone: "green" as const,
    },
    {
      icon: Wand2,
      label: "AI 图片建议",
      desc: "Midjourney / SD 提示词",
      href: `/ai-prompts?productId=${productId}`,
      tone: "orange" as const,
    },
    {
      icon: Calculator,
      label: "利润计算",
      desc: "完整跨境利润模型",
      href: `/finance?productId=${productId}`,
      tone: "blue" as const,
    },
    {
      icon: Lightbulb,
      label: "产品优化",
      desc: "下一步可执行清单",
      href: `/optimization?productId=${productId}`,
      tone: "orange" as const,
    },
  ];

  return (
    <SectionCard title="快捷入口" description="跳转到相关模块继续推进。">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {entries.map((e) => {
          const Icon = e.icon;
          const className =
            "group flex flex-col items-start gap-2 p-4 rounded-2xl border border-apple-gray-100 bg-white hover:shadow-card hover:border-apple-gray-200 transition cursor-pointer";
          const inner = (
            <>
              <div
                className={[
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  toneEntryBg(e.tone),
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-apple-gray-900 group-hover:text-apple-blue transition">
                  {e.label}
                </div>
                <div className="text-[11px] text-apple-gray-300 mt-0.5">{e.desc}</div>
              </div>
            </>
          );
          return e.href ? (
            <Link key={e.label} href={e.href} className={className}>
              {inner}
            </Link>
          ) : (
            <button key={e.label} type="button" onClick={e.action} className={`text-left ${className}`}>
              {inner}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function toneEntryBg(tone: "blue" | "green" | "orange" | "purple"): string {
  return {
    blue: "bg-apple-blue/10 text-apple-blue",
    green: "bg-apple-green/10 text-apple-green",
    orange: "bg-apple-orange/10 text-apple-orange",
    purple: "bg-purple-100 text-purple-600",
  }[tone];
}

// keep getMockProducts import for tree-shaking determinism on dev
void getMockProducts;
