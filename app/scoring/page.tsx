"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Grid3x3,
  Save,
  RotateCcw,
  Sparkles,
  History,
  ChevronRight,
  Trash2,
  Star,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Info,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

import {
  STATUS_TONE,
  MOCK_MARKET_LABELS,
  type MockProduct,
} from "@/data/mockData";
import {
  DEFAULT_SCORING,
  SCORING_DIMENSIONS,
  SCORING_DIMENSION_KEYS,
  addScoringRecord,
  buildScoringSuggestions,
  calculateScoringAverage,
  calculateScoringTotal,
  deleteScoringRecord,
  getCellTone,
  getScoringRecommendation,
  getScoringRecords,
  type ScoringDimensionKey,
  type ScoringDimensions,
  type ScoringRecord,
  type ScoringSuggestion,
} from "@/data/scoring";
import { logActivity, formatRelativeTime } from "@/data/activity";
import { fetchApiProducts } from "@/lib/api/products";
import {
  deleteApiScoringRecord,
  fetchApiScoringRecords,
  saveApiScoringRecord,
} from "@/lib/api/scoringRecords";

/* ============================================================
 *  Page entry (Suspense wraps useSearchParams)
 * ============================================================ */

export default function ScoringPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-apple-gray-300">加载中…</div>}>
      <ScoringInner />
    </Suspense>
  );
}

function ScoringInner() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") ?? "";

  const [products, setProducts] = useState<MockProduct[]>([]);
  const [productId, setProductId] = useState<string>(initialProductId);
  const [scores, setScores] = useState<ScoringDimensions>(DEFAULT_SCORING);
  const [records, setRecords] = useState<ScoringRecord[]>([]);
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [remoteProducts, remoteRecords] = await Promise.all([
        fetchApiProducts(),
        fetchApiScoringRecords(),
      ]);
      if (!active) return;

      const nextProducts = remoteProducts ?? [];
      setProducts(nextProducts);
      setRecords(remoteRecords ?? getScoringRecords());

      // Auto-pick the first product if no ?productId= specified
      if (!initialProductId && nextProducts.length > 0) {
        setProductId(nextProducts[0].id);
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, [initialProductId]);

  useEffect(() => {
    // When the selected product changes, prefill from its latest record
    if (!productId) return;
    const history = records
      .filter((record) => record.productId === productId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (history.length > 0) {
      setScores(history[0].scores);
    } else {
      setScores(DEFAULT_SCORING);
    }
  }, [productId, records, reloadKey]);

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const total = useMemo(() => calculateScoringTotal(scores), [scores]);
  const average = useMemo(() => calculateScoringAverage(scores), [scores]);
  const recommendation = useMemo(() => getScoringRecommendation(average), [average]);
  const suggestions = useMemo(() => buildScoringSuggestions(scores), [scores]);
  const productHistory = useMemo(
    () => (productId ? records.filter((r) => r.productId === productId) : []),
    [records, productId]
  );

  function updateScore(key: ScoringDimensionKey, value: number) {
    setScores((s) => ({ ...s, [key]: clamp(value, 1, 10) }));
    setSaved(false);
  }

  function handleReset() {
    setScores(DEFAULT_SCORING);
    setSaved(false);
  }

  function handleSave() {
    if (!product) return;
    const record = addScoringRecord({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      scores,
      total,
      average,
      recommendationLevel: recommendation.level,
    });
    logActivity({
      type: "scoring_completed",
      productId: product.id,
      productName: product.name,
      detail: `九宫格平均分 ${average.toFixed(1)} · ${recommendation.label}`,
    });
    setRecords((current) => [record, ...current.filter((item) => item.id !== record.id)]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    void saveApiScoringRecord(record);
  }

  function handleLoadRecord(r: ScoringRecord) {
    setScores(r.scores);
    setSaved(false);
  }

  function handleDeleteRecord(r: ScoringRecord) {
    if (!confirm("删除该评分记录？历史快照将无法恢复。")) return;
    deleteScoringRecord(r.id);
    setRecords((current) => current.filter((item) => item.id !== r.id));
    setReloadKey((k) => k + 1);
    void deleteApiScoringRecord(r.id);
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        icon={Grid3x3}
        title="九宫格选品评分"
        description="从 9 个维度对一个候选产品打分，自动计算总分、平均分与推荐等级，所有结果存到本地，刷新不丢失。"
        badge="Phase 4"
      />

      {/* === Product selector === */}
      <ProductSelector
        products={products}
        selectedId={productId}
        onSelect={setProductId}
        product={product}
      />

      {/* === Main editor row === */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <SectionCard
          title="九宫格评分"
          description="拖动滑块或输入数字（1-10），上方背景颜色会随分值变化。"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[12.5px] text-apple-gray-300 hover:text-apple-gray-900 px-2.5 py-1 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重置
              </button>
              <Button
                onClick={handleSave}
                icon={Save}
                size="sm"
                disabled={!product}
              >
                {saved ? "已保存 ✓" : "保存评分"}
              </Button>
            </div>
          }
        >
          {!product ? (
            <div className="py-12 text-center text-[13px] text-apple-gray-300">
              请先在上方选择一个产品。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {SCORING_DIMENSIONS.map((dim) => (
                <ScoringCell
                  key={dim.key}
                  dim={dim}
                  value={scores[dim.key]}
                  onChange={(v) => updateScore(dim.key, v)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Right column: summary cards stacked */}
        <div className="space-y-4">
          <SummaryStat
            label="总分"
            value={total}
            suffix={`/ ${SCORING_DIMENSION_KEYS.length * 10}`}
            tone="blue"
          />
          <SummaryStat
            label="平均分"
            value={average.toFixed(1)}
            suffix="/ 10"
            tone={recommendation.tone}
          />
          <RecommendationCard meta={recommendation} />
        </div>
      </div>

      {/* === AI suggestions === */}
      <AISuggestionsCard suggestions={suggestions} disabled={!product} />

      {/* === History === */}
      <HistoryCard
        records={productHistory}
        product={product}
        onLoad={handleLoadRecord}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
}

/* ============================================================
 *  Product selector
 * ============================================================ */

function ProductSelector({
  products,
  selectedId,
  onSelect,
  product,
}: {
  products: MockProduct[];
  selectedId: string;
  onSelect: (id: string) => void;
  product?: MockProduct;
}) {
  return (
    <SectionCard
      title="选择产品"
      description="先挑一个候选品，下方的九宫格将以它的最近一次评分作为起点。"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4 items-stretch">
        <div>
          <label className="text-[12px] text-apple-gray-300 mb-1.5 block">产品</label>
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full bg-apple-gray-50 rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">— 请选择 —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.platform}] {p.name}
              </option>
            ))}
          </select>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[12px] text-apple-blue hover:underline mt-2"
          >
            没有合适的？去新建一个 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl bg-apple-gray-50/60 border border-apple-gray-100 p-3.5">
          {!product ? (
            <div className="text-center py-6 text-[12.5px] text-apple-gray-300">
              选定产品后这里会展示它的基础信息。
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-xl bg-white object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[13.5px] font-medium text-apple-gray-900 truncate">
                    {product.name}
                  </div>
                  <Badge tone={STATUS_TONE[product.status]} size="sm">
                    {product.status}
                  </Badge>
                </div>
                <div className="text-[11.5px] text-apple-gray-300 mt-1 truncate">
                  {product.platform} · {product.category} · ★ {product.rating.toFixed(1)} · 月销 {product.monthlySales.toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {product.targetMarket.slice(0, 5).map((m) => (
                    <span
                      key={m}
                      className="text-[10.5px] bg-white text-apple-gray-300 rounded-md px-1.5 py-0.5 border border-apple-gray-100"
                    >
                      {MOCK_MARKET_LABELS[m] ?? m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ============================================================
 *  9-cell scoring grid cell
 * ============================================================ */

const CELL_TONE_CLASSES: Record<
  "red" | "orange" | "blue" | "green",
  { bg: string; ring: string; icon: string; bar: "red" | "orange" | "blue" | "green" }
> = {
  red: {
    bg: "bg-apple-red/[0.06]",
    ring: "ring-apple-red/30",
    icon: "bg-apple-red/10 text-apple-red",
    bar: "red",
  },
  orange: {
    bg: "bg-apple-orange/[0.06]",
    ring: "ring-apple-orange/30",
    icon: "bg-apple-orange/10 text-apple-orange",
    bar: "orange",
  },
  blue: {
    bg: "bg-apple-blue/[0.06]",
    ring: "ring-apple-blue/30",
    icon: "bg-apple-blue/10 text-apple-blue",
    bar: "blue",
  },
  green: {
    bg: "bg-apple-green/[0.07]",
    ring: "ring-apple-green/30",
    icon: "bg-apple-green/10 text-apple-green",
    bar: "green",
  },
};

function ScoringCell({
  dim,
  value,
  onChange,
}: {
  dim: (typeof SCORING_DIMENSIONS)[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const Icon = dim.icon;
  const tone = getCellTone(value);
  const cls = CELL_TONE_CLASSES[tone];

  return (
    <div
      className={[
        "rounded-2xl p-4 ring-1 ring-inset transition-colors",
        cls.bg,
        cls.ring,
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={["w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cls.icon].join(" ")}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="text-[13px] font-semibold text-apple-gray-900 truncate">
            {dim.label}
          </div>
        </div>
        <span className="text-[22px] font-semibold tabular-nums text-apple-gray-900 leading-none shrink-0">
          {value}
        </span>
      </div>

      <p className="text-[11.5px] text-apple-gray-300 leading-relaxed mb-3 min-h-[2.5rem]">
        {dim.description}
      </p>

      <div className="flex items-center gap-2.5">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
          aria-label={`${dim.label} 分值`}
        />
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) onChange(v);
          }}
          className="w-12 text-center bg-white rounded-lg border border-apple-gray-100 text-[12.5px] py-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
        />
      </div>

      <div className="mt-2">
        <ProgressBar value={value} max={10} tone={cls.bar} />
      </div>
    </div>
  );
}

/* ============================================================
 *  Summary cards
 * ============================================================ */

const SUMMARY_TONE: Record<
  "blue" | "green" | "orange" | "red",
  { ring: string; valueColor: string }
> = {
  blue: { ring: "ring-apple-blue/15", valueColor: "text-apple-blue" },
  green: { ring: "ring-apple-green/20", valueColor: "text-apple-green" },
  orange: { ring: "ring-apple-orange/20", valueColor: "text-apple-orange" },
  red: { ring: "ring-apple-red/20", valueColor: "text-apple-red" },
};

function SummaryStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone: "blue" | "green" | "orange" | "red";
}) {
  const t = SUMMARY_TONE[tone];
  return (
    <div className={["bg-white rounded-2xl p-5 ring-1 ring-inset", t.ring].join(" ")}>
      <div className="text-[12px] text-apple-gray-300 mb-2">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className={["text-[36px] font-semibold tracking-tight tabular-nums leading-none", t.valueColor].join(" ")}>
          {value}
        </div>
        {suffix && <div className="text-[13px] text-apple-gray-300">{suffix}</div>}
      </div>
    </div>
  );
}

function RecommendationCard({
  meta,
}: {
  meta: ReturnType<typeof getScoringRecommendation>;
}) {
  const toneRing = {
    green: "ring-apple-green/20",
    orange: "ring-apple-orange/20",
    red: "ring-apple-red/20",
  }[meta.tone];
  const toneBgFg = {
    green: "bg-apple-green/10 text-apple-green",
    orange: "bg-apple-orange/10 text-apple-orange",
    red: "bg-apple-red/10 text-apple-red",
  }[meta.tone];

  return (
    <div className={["bg-white rounded-2xl p-5 ring-1 ring-inset", toneRing].join(" ")}>
      <div className="text-[12px] text-apple-gray-300 mb-2">推荐等级</div>
      <div className="flex items-center gap-2 mb-1">
        <span className={["inline-flex items-center text-[13px] font-semibold rounded-full px-2.5 py-0.5", toneBgFg].join(" ")}>
          {meta.label}
        </span>
      </div>
      <div className="text-[14px] font-medium text-apple-gray-900 mb-1.5">{meta.action}</div>
      <div className="text-[11.5px] text-apple-gray-300 leading-relaxed">{meta.tip}</div>
    </div>
  );
}

/* ============================================================
 *  AI suggestions
 * ============================================================ */

const SUGGESTION_ICON = {
  green: TrendingUp,
  blue: Lightbulb,
  orange: AlertTriangle,
  red: AlertTriangle,
};

function AISuggestionsCard({
  suggestions,
  disabled,
}: {
  suggestions: ScoringSuggestion[];
  disabled: boolean;
}) {
  return (
    <SectionCard
      title="AI 分析建议"
      description="根据当前九维分布给出可执行的下一步动作。"
      action={
        <Badge tone="purple" size="sm">
          <Sparkles className="w-3 h-3 inline mr-0.5" /> 自动生成
        </Badge>
      }
    >
      {disabled ? (
        <div className="py-6 text-center text-[12.5px] text-apple-gray-300">
          先选择一个产品并完成打分。
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, i) => {
            const Icon = SUGGESTION_ICON[s.tone];
            return (
              <li
                key={i}
                className="p-4 rounded-2xl bg-apple-gray-50/60 border border-apple-gray-100 flex items-start gap-3"
              >
                <div
                  className={[
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    suggestionBg(s.tone),
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-apple-gray-900 mb-0.5">
                    {s.title}
                  </div>
                  <div className="text-[12px] text-apple-gray-300 leading-relaxed">
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

function suggestionBg(tone: "green" | "blue" | "orange" | "red"): string {
  return {
    green: "bg-apple-green/10 text-apple-green",
    blue: "bg-apple-blue/10 text-apple-blue",
    orange: "bg-apple-orange/10 text-apple-orange",
    red: "bg-apple-red/10 text-apple-red",
  }[tone];
}

/* ============================================================
 *  History records
 * ============================================================ */

function HistoryCard({
  records,
  product,
  onLoad,
  onDelete,
}: {
  records: ScoringRecord[];
  product?: MockProduct;
  onLoad: (r: ScoringRecord) => void;
  onDelete: (r: ScoringRecord) => void;
}) {
  const recommendationToneClass: Record<"high" | "medium" | "low", "green" | "orange" | "red"> = {
    high: "green",
    medium: "orange",
    low: "red",
  };
  const recommendationLabel: Record<"high" | "medium" | "low", string> = {
    high: "高潜力",
    medium: "中等潜力",
    low: "暂不建议",
  };

  return (
    <SectionCard
      title="历史评分记录"
      description={
        product
          ? `「${product.name}」共有 ${records.length} 次评分。`
          : "选择产品后这里会展示该产品的历史评分。"
      }
      action={
        <Badge tone="gray" size="sm">
          <History className="w-3 h-3 inline mr-0.5" /> localStorage
        </Badge>
      }
      bodyClassName="p-0"
    >
      {!product ? (
        <div className="py-10 text-center text-[12.5px] text-apple-gray-300">—</div>
      ) : records.length === 0 ? (
        <div className="py-10 text-center text-[12.5px] text-apple-gray-300">
          <Info className="w-5 h-5 mx-auto opacity-50 mb-2" />
          该产品还没有评分记录，点击上方「保存评分」生成第一条。
        </div>
      ) : (
        <ul className="divide-y divide-apple-gray-100">
          {records.map((r) => (
            <li key={r.id} className="px-5 py-3.5 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 rounded-lg bg-apple-blue/10 text-apple-blue flex items-center justify-center shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-apple-gray-900 tabular-nums">
                    平均 {r.average.toFixed(1)} · 总分 {r.total}/90
                  </span>
                  <Badge tone={recommendationToneClass[r.recommendationLevel]} size="sm">
                    {recommendationLabel[r.recommendationLevel]}
                  </Badge>
                </div>
                <div className="text-[11.5px] text-apple-gray-300 mt-0.5">
                  {new Date(r.createdAt).toLocaleString("zh-CN")} · {formatRelativeTime(r.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onLoad(r)}
                  className="text-[12px] text-apple-blue hover:bg-apple-blue/5 transition rounded-lg px-2.5 py-1"
                >
                  载入编辑
                </button>
                <button
                  onClick={() => onDelete(r)}
                  className="p-1.5 rounded-lg text-apple-gray-300 hover:text-apple-red hover:bg-apple-red/5 transition"
                  aria-label="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ============================================================
 *  Utils
 * ============================================================ */

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
