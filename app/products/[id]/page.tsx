"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/Card";
import RecommendationBadge from "@/components/RecommendationBadge";
import ScoringTab from "./ScoringTab";
import CopywritingTab from "./CopywritingTab";
import ImageReviewTab from "./ImageReviewTab";
import { deleteProduct, getProduct } from "@/lib/storage";
import { COUNTRY_LABELS, type Product } from "@/lib/types";

type TabKey = "scoring" | "copywriting" | "images";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "scoring", label: "九宫格打分" },
  { key: "copywriting", label: "多语言文案" },
  { key: "images", label: "图片优化建议" },
];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<TabKey>("scoring");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = getProduct(params.id);
    setProduct(p ?? null);
    setLoaded(true);
  }, [params.id]);

  function refresh() {
    setProduct(getProduct(params.id) ?? null);
  }

  function handleDelete() {
    if (!product) return;
    if (!confirm("确认删除该产品？")) return;
    deleteProduct(product.id);
    router.push("/products");
  }

  if (!loaded) return <div className="text-apple-gray-300 text-[13px]">加载中…</div>;

  if (!product) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <div className="text-[15px] font-semibold text-apple-gray-900 mb-2">未找到该产品</div>
          <div className="text-[13px] text-apple-gray-300 mb-5">可能已被删除，或链接有误。</div>
          <Link href="/products" className="text-apple-blue text-[13px]">
            返回产品库 →
          </Link>
        </CardBody>
      </Card>
    );
  }

  const margin =
    product.sellPrice > 0
      ? Math.round(((product.sellPrice - product.costPrice) / product.sellPrice) * 100)
      : 0;

  return (
    <div className="space-y-6 fade-in">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-[13px] text-apple-gray-300 hover:text-apple-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回产品库
      </Link>

      {/* 头部信息卡 */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-[22px] font-semibold text-apple-gray-900 truncate">
                  {product.name}
                </h2>
                {product.recommendation && <RecommendationBadge recommendation={product.recommendation} />}
              </div>
              <div className="text-[13px] text-apple-gray-300">
                {product.platform} · {product.category} ·{" "}
                {product.targetCountries.map((c) => COUNTRY_LABELS[c]).join(", ")}
              </div>
              {product.notes && (
                <div className="text-[13px] text-apple-gray-300 mt-3 leading-relaxed">
                  {product.notes}
                </div>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl text-apple-gray-300 hover:text-apple-red hover:bg-apple-red/5 transition"
              title="删除产品"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-apple-gray-100">
            <Stat label="成本价" value={`¥${product.costPrice.toFixed(2)}`} />
            <Stat label="售价" value={`¥${product.sellPrice.toFixed(2)}`} />
            <Stat
              label="毛利率"
              value={`${margin}%`}
              valueClass={
                margin > 50 ? "text-apple-green" : margin > 30 ? "text-apple-orange" : "text-apple-red"
              }
            />
            <Stat label="重量" value={`${product.weight}kg`} />
          </div>

          {(product.supplierUrl || product.competitorUrl) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {product.supplierUrl && (
                <a
                  href={product.supplierUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-apple-blue hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  供应商链接
                </a>
              )}
              {product.competitorUrl && (
                <a
                  href={product.competitorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-apple-blue hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  竞品链接
                </a>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tab 导航 */}
      <Card>
        <CardHeader
          title="工作区"
          action={
            <div className="flex bg-apple-gray-50 rounded-xl p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={[
                    "px-3.5 py-1.5 text-[12px] rounded-lg transition",
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
        />
        <CardBody>
          {tab === "scoring" && <ScoringTab product={product} onUpdated={refresh} />}
          {tab === "copywriting" && <CopywritingTab product={product} onUpdated={refresh} />}
          {tab === "images" && <ImageReviewTab product={product} onUpdated={refresh} />}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[11px] text-apple-gray-300 mb-1">{label}</div>
      <div className={["text-[18px] font-semibold text-apple-gray-900", valueClass].join(" ")}>{value}</div>
    </div>
  );
}
