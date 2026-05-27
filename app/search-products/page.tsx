"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, MapPin, PackageCheck, Plus, Search, ShoppingBag, Star, X } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  MAX_COMPARE_COUNT,
  addCompareItem,
  competitionLabel,
  formatUsd,
  getCompareItems,
  removeCompareItem,
  saveCompareItems,
  subscribeCompareItems,
  type CompetitorItem,
  type CompetitionLevel,
  type PlatformName,
} from "@/data/phase5";
import { fetchApiCompareItems, saveApiCompareItems } from "@/lib/api/compareItems";
import {
  promoteSearchProduct,
  searchApiProducts,
  type SearchProductsProvider,
  type SearchProductsResponse,
} from "@/lib/api/searchProducts";

const PROVIDER_LABEL: Record<SearchProductsProvider, string> = {
  unconfigured: "未配置数据源",
  auto: "全网聚合",
  mock: "Mock 全网数据",
  external: "自建接口",
  rainforest: "Amazon 实时",
  zhixia: "Shopee / Lazada (知虾)",
  fastmoss: "TikTok Shop (FastMoss)",
  apify: "Temu (Apify)",
};

function describeSourceBadge(meta: Pick<SearchProductsResponse, "provider" | "providers">): string {
  if (meta.providers && meta.providers.length > 1) {
    return `已聚合 ${meta.providers.length} 个数据源`;
  }
  if (meta.providers && meta.providers.length === 1) {
    return PROVIDER_LABEL[meta.providers[0]] ?? meta.providers[0];
  }
  return PROVIDER_LABEL[meta.provider] ?? meta.provider;
}

const PLATFORM_OPTIONS: Array<PlatformName | ""> = ["", "Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"];

function competitionTone(level: CompetitionLevel): "green" | "orange" | "red" {
  return level === "low" ? "green" : level === "medium" ? "orange" : "red";
}

function platformClass(platform: PlatformName) {
  return {
    Shopee: "bg-orange-100 text-orange-600",
    Lazada: "bg-blue-100 text-blue-600",
    "TikTok Shop": "bg-purple-100 text-purple-600",
    Amazon: "bg-yellow-100 text-yellow-700",
    Temu: "bg-pink-100 text-pink-600",
    AliExpress: "bg-red-100 text-red-600",
  }[platform];
}

function formatOptionalMoney(value: number | null) {
  return value === null ? "暂无" : formatUsd(value);
}

function formatOptionalNumber(value: number | null) {
  return value === null ? "暂无" : value.toLocaleString();
}

function profitTone(value: number | null) {
  if (value === null) return "text-apple-gray-300";
  return value >= 25 ? "text-apple-green" : value < 18 ? "text-apple-red" : "text-apple-gray-900";
}

export default function SearchProductsPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformName | "">("");
  const [results, setResults] = useState<CompetitorItem[]>([]);
  const [compareItems, setCompareItems] = useState<CompetitorItem[]>([]);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const [searchMeta, setSearchMeta] = useState<Omit<SearchProductsResponse, "ok" | "items"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCompareItems() {
      const remoteItems = await fetchApiCompareItems();
      if (!active) return;
      if (remoteItems) {
        saveCompareItems(remoteItems);
        setCompareItems(remoteItems);
        return;
      }
      setCompareItems(getCompareItems());
    }

    void loadCompareItems();
    return subscribeCompareItems(() => setCompareItems(getCompareItems()));
  }, []);

  const compareIds = useMemo(() => compareItems.map((item) => item.id), [compareItems]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1500);
  }

  async function runSearch(nextKeyword = keyword, nextPlatform = platform) {
    const normalizedKeyword = nextKeyword.trim();
    setSubmittedKeyword(normalizedKeyword);
    setLoading(true);
    setError("");
    try {
      const response = await searchApiProducts({
        keyword: normalizedKeyword,
        platform: nextPlatform,
        limit: 30,
      });
      setResults(response.items);
      setSearchMeta({
        provider: response.provider,
        providers: response.providers,
        requestedProvider: response.requestedProvider,
        fallbackUsed: response.fallbackUsed,
        warning: response.warning,
        warnings: response.warnings,
      });
    } catch {
      setResults([]);
      setSearchMeta(null);
      setError("搜索请求失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    void runSearch();
  }

  function handleAdd(item: CompetitorItem) {
    const result = addCompareItem(item);
    const nextItems = getCompareItems();
    setCompareItems(nextItems);
    if (!result.ok) {
      showToast(result.reason === "full" ? `最多加入 ${MAX_COMPARE_COUNT} 个竞品` : "该竞品已在对比列表");
      return;
    }
    void saveApiCompareItems(nextItems);
    showToast("已加入对比，并保存到账号");
  }

  function handleRemove(item: CompetitorItem) {
    if (!confirm("确认从竞品对比中移除该商品？")) return;
    removeCompareItem(item.id);
    const nextItems = getCompareItems();
    setCompareItems(nextItems);
    void saveApiCompareItems(nextItems);
    showToast("已从对比中移除");
  }

  async function handlePromote(item: CompetitorItem) {
    const product = await promoteSearchProduct(item);
    if (!product) {
      showToast("加入选品库失败，请检查登录状态和数据库配置");
      return;
    }
    setPromotedIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    showToast("已加入选品库，可继续生成 Shopee 上架草稿");
  }

  const hasSearched = submittedKeyword !== null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        title="全网查品"
        badge={searchMeta?.provider === "unconfigured" ? "未配置数据源" : "商品搜索"}
        description="输入产品关键词后返回跨平台竞品列表，并可把竞品加入对比，保存到当前账号。"
        action={
          compareIds.length ? (
            <LinkButton href="/competitors" variant="secondary" iconRight={ArrowRight}>
              已加入 {compareIds.length} 个对比
            </LinkButton>
          ) : (
            <LinkButton href="/competitors" variant="secondary">
              竞品对比
            </LinkButton>
          )
        }
      />

      <SectionCard title="搜索条件" description="支持中文、英文关键词，也可以只选择平台后直接搜索。">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-gray-300" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="输入产品关键词，例如：收纳、眼罩、pet feeder"
              className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 py-2.5 pl-9 pr-9 text-[13px] outline-none focus:border-apple-blue"
            />
            {keyword && (
              <button
                type="button"
                aria-label="清空关键词"
                onClick={() => {
                  setKeyword("");
                  setSubmittedKeyword(null);
                  setResults([]);
                  setSearchMeta(null);
                  setError("");
                }}
                className="absolute right-2 top-1/2 rounded-md p-1 -translate-y-1/2 text-apple-gray-300 hover:bg-apple-gray-100 hover:text-apple-gray-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as PlatformName | "")}
            className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
          >
            {PLATFORM_OPTIONS.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "所有平台"}
              </option>
            ))}
          </select>
          <Button icon={Search} type="submit">
            搜索
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-apple-gray-300">试试：</span>
          {["收纳", "眼罩", "宠物", "鼠标", "露营灯", "厨房"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setKeyword(item);
                void runSearch(item);
              }}
              className="text-apple-blue hover:underline"
            >
              {item}
            </button>
          ))}
        </div>
      </SectionCard>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-apple-gray-900 px-4 py-2.5 text-[12.5px] text-white shadow-hover">
          {toast}
        </div>
      )}

      {!hasSearched ? (
        <SectionCard>
          <EmptyState
            icon={ShoppingBag}
            title="还没有发起搜索"
            description="输入关键词后点击搜索，系统会请求商品搜索接口并返回竞品列表。"
          />
        </SectionCard>
      ) : loading ? (
        <SectionCard>
          <EmptyState
            icon={Search}
            title="正在搜索"
            description="正在向商品搜索接口请求跨平台结果。"
          />
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <EmptyState icon={Search} title="搜索失败" description={error} />
        </SectionCard>
      ) : results.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Search}
            title="没有匹配结果"
            description={searchMeta?.warning ?? "可以换一个更宽泛的关键词，或者切换到已接入的数据源。"}
          />
        </SectionCard>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[12.5px] text-apple-gray-300">
            <span>
              找到 <span className="font-medium text-apple-gray-900">{results.length}</span> 个竞品
              {submittedKeyword ? <>，关键词 <span className="text-apple-gray-900">{submittedKeyword}</span></> : null}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span>对比列表 {compareIds.length}/{MAX_COMPARE_COUNT}</span>
              {searchMeta && (
                <Badge
                  tone={
                    searchMeta.provider === "unconfigured" || (searchMeta.providers?.length ?? 0) === 0
                      ? "gray"
                      : "green"
                  }
                  size="sm"
                >
                  {describeSourceBadge(searchMeta)}
                </Badge>
              )}
            </div>
          </div>
          {(searchMeta?.warnings?.length ?? 0) > 0 ? (
            <div className="space-y-1 rounded-2xl border border-apple-orange/20 bg-apple-orange/5 px-4 py-3 text-[12px] text-apple-orange">
              {searchMeta!.warnings!.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          ) : searchMeta?.warning ? (
            <div className="rounded-2xl border border-apple-orange/20 bg-apple-orange/5 px-4 py-3 text-[12px] text-apple-orange">
              {searchMeta.warning}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => (
              <CompetitorCard
                key={item.id}
                item={item}
                selected={compareIds.includes(item.id)}
                promoted={promotedIds.includes(item.id)}
                full={!compareIds.includes(item.id) && compareIds.length >= MAX_COMPARE_COUNT}
                onAdd={() => handleAdd(item)}
                onRemove={() => handleRemove(item)}
                onPromote={() => void handlePromote(item)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CompetitorCard({
  item,
  selected,
  promoted,
  full,
  onAdd,
  onRemove,
  onPromote,
}: {
  item: CompetitorItem;
  selected: boolean;
  promoted: boolean;
  full: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onPromote: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-apple-gray-100 bg-white shadow-card">
      <div className="flex-1 p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", platformClass(item.platform)].join(" ")}>
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-apple-gray-900">{item.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-apple-gray-300">
              <span>{item.platform}</span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {item.shippingFrom}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-baseline gap-3">
          <span className="text-[22px] font-semibold tabular-nums text-apple-gray-900">{formatOptionalMoney(item.price)}</span>
          {item.rating === null ? (
            <span className="text-[12px] text-apple-gray-300">评分 暂无</span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[12px] text-apple-gray-300">
              <Star className="h-3.5 w-3.5 fill-apple-orange text-apple-orange" />
              <span className="text-apple-gray-900">{item.rating.toFixed(1)}</span>
              <span>({formatOptionalNumber(item.reviewCount)})</span>
            </span>
          )}
          <span className="text-[12px] text-apple-gray-300">
            月销量 <span className="text-apple-gray-900">{formatOptionalNumber(item.monthlySales)}</span>
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {item.sellingPoints.length ? (
            item.sellingPoints.map((point) => (
              <Badge key={point} tone="gray" size="sm">{point}</Badge>
            ))
          ) : (
            <span className="text-[12px] text-apple-gray-300">暂无结构化卖点</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-apple-gray-100 pt-4 text-center">
          <Metric label="竞争强度"><Badge tone={competitionTone(item.competition)} size="sm">{competitionLabel(item.competition)}</Badge></Metric>
          <Metric label="预估利润率"><span className={profitTone(item.estimatedProfitRate)}>{item.estimatedProfitRate === null ? "暂无" : `${item.estimatedProfitRate}%`}</span></Metric>
          <Metric label="推荐指数"><span>{item.recommendationIndex === null ? "暂无" : `${item.recommendationIndex}/10`}</span></Metric>
        </div>
      </div>

      <div className="space-y-2 px-5 pb-5">
        <button
          type="button"
          onClick={onPromote}
          disabled={promoted}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-apple-gray-100 bg-white py-2 text-[12.5px] font-medium text-apple-gray-900 hover:bg-apple-gray-50 disabled:cursor-not-allowed disabled:text-apple-green"
        >
          <PackageCheck className="h-4 w-4" />
          {promoted ? "已加入选品库" : "加入选品库"}
        </button>
        {selected ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-apple-green/10 py-2 text-[12.5px] font-medium text-apple-green hover:bg-apple-green/15"
          >
            <Check className="h-4 w-4" />
            已加入对比，点击移除
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={full}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-apple-blue py-2 text-[12.5px] font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {full ? "对比列表已满" : "加入对比"}
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10.5px] text-apple-gray-300">{label}</div>
      <div className="text-[13px] font-semibold tabular-nums text-apple-gray-900">{children}</div>
    </div>
  );
}
