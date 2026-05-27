"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Lightbulb } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import type { MockProduct } from "@/data/mockData";
import { fetchApiProducts } from "@/lib/api/products";

export default function OptimizationPage() {
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [productId, setProductId] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      const remoteProducts = await fetchApiProducts();
      if (!active) return;
      const next = remoteProducts ?? [];
      setProducts(next);
      setProductId((current) => current || next[0]?.id || "");
    }
    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [products, productId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Lightbulb}
        title="产品优化建议"
        badge="待接入运营数据"
        description="选择产品后展示真实曝光、点击率、转化率、退款率、利润率、广告花费和 ROI，再生成优化建议。"
      />

      <SectionCard title="产品选择" description="这里只展示数据库中的真实产品，不再使用演示产品列表。">
        {products.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">选择产品</label>
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-apple-gray-50 px-4 py-3 text-[12px] text-apple-gray-300">
              {selectedProduct ? `${selectedProduct.platform} · ${selectedProduct.category}` : "未选择产品"}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="暂无产品"
            description="请先在产品库中新建或同步真实产品，再查看运营优化建议。"
            actionHref="/products/new"
            actionLabel="新建产品"
          />
        )}
      </SectionCard>

      <SectionCard title="运营数据" description="等待接入店铺或广告平台接口后展示。">
        <EmptyState
          icon={BarChart3}
          title="暂无真实运营数据"
          description="当前已移除本地演示数据。后续接入 Shopee 店铺数据、广告数据和售后数据后，这里会自动判断点击率、转化率、利润率、退款率和 ROI 问题。"
        />
      </SectionCard>
    </div>
  );
}
