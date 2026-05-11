"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Plus, Trash2 } from "lucide-react";

import { Card, CardBody } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import RecommendationBadge from "@/components/RecommendationBadge";
import { deleteProduct, getProducts, seedIfEmpty } from "@/lib/storage";
import { COUNTRY_LABELS, CATEGORIES, type Product } from "@/lib/types";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  useEffect(() => {
    seedIfEmpty();
    setProducts(getProducts());
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (platform && p.platform !== platform) return false;
      if (category && p.category !== category) return false;
      if (recommendation && p.recommendation !== recommendation) return false;
      return true;
    });
  }, [products, keyword, platform, category, recommendation]);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确认删除该产品？")) return;
    deleteProduct(id);
    setProducts(getProducts());
  }

  return (
    <div className="space-y-5 fade-in">
      {/* 筛选栏 */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索产品名称…"
            className="flex-1 min-w-[200px] bg-apple-gray-50 rounded-xl py-2 px-4 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-apple-gray-50 rounded-xl py-2 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有平台</option>
            <option value="Shopee">Shopee</option>
            <option value="Lazada">Lazada</option>
            <option value="TikTok Shop">TikTok Shop</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-apple-gray-50 rounded-xl py-2 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有品类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="bg-apple-gray-50 rounded-xl py-2 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有推荐等级</option>
            <option value="recommend">推荐上架</option>
            <option value="caution">谨慎测试</option>
            <option value="avoid">不建议做</option>
          </select>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 bg-apple-blue text-white rounded-xl px-4 py-2 text-[13px] font-medium hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            新建产品
          </Link>
        </CardBody>
      </Card>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="没有匹配的产品"
            description="试着调整筛选条件，或者添加一个新产品。"
            actionHref="/products/new"
            actionLabel="新建产品"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card hoverable className="cursor-pointer h-full">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-apple-gray-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-[12px] text-apple-gray-300 mt-1">
                        {p.platform} · {p.category}
                      </div>
                    </div>
                    {p.recommendation && (
                      <RecommendationBadge recommendation={p.recommendation} size="sm" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap mb-4">
                    {p.targetCountries.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] bg-apple-gray-50 text-apple-gray-300 rounded-md px-1.5 py-0.5"
                      >
                        {COUNTRY_LABELS[c]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-apple-gray-100">
                    <div>
                      <div className="text-[11px] text-apple-gray-300">综合评分</div>
                      <div className="text-[24px] font-semibold text-apple-gray-900 leading-none mt-1">
                        {p.totalScore?.toFixed(1) ?? "—"}
                        <span className="text-[12px] text-apple-gray-300 font-normal"> /10</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[11px] text-apple-gray-300">毛利率</div>
                        <div className="text-[13px] font-medium text-apple-gray-900">
                          {p.sellPrice > 0
                            ? `${Math.round(((p.sellPrice - p.costPrice) / p.sellPrice) * 100)}%`
                            : "—"}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="ml-2 p-2 rounded-lg text-apple-gray-300 hover:text-apple-red hover:bg-apple-red/5 transition"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
