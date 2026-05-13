"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";

import {
  generateMockProductId,
  upsertMockProduct,
  MOCK_CATEGORIES,
  MOCK_PLATFORM_OPTIONS,
  MOCK_STATUS_OPTIONS,
  MOCK_MARKET_OPTIONS,
  type MockProduct,
  type ProductPlatform,
  type ProductStatus,
} from "@/data/mockData";
import { computeProfit, formatPct, formatUsd } from "@/data/derived";
import { logActivity } from "@/data/activity";
import { createApiProduct } from "@/lib/api/products";

/** Default commission % per platform (mirrors common SEA / global benchmarks). */
const DEFAULT_COMMISSION: Record<ProductPlatform, number> = {
  Shopee: 0.08,
  Lazada: 0.07,
  "TikTok Shop": 0.05,
  Amazon: 0.15,
  Temu: 0.05,
  AliExpress: 0.08,
};

interface FormState {
  name: string;
  category: string;
  platform: ProductPlatform;
  targetMarket: string[];
  costPrice: string; // keep as strings for the input UX
  salePrice: string;
  shippingCost: string;
  supplierUrl: string;
  image: string;
  stock: string;
  notes: string;
  status: ProductStatus;
}

const INITIAL: FormState = {
  name: "",
  category: MOCK_CATEGORIES[0],
  platform: "Shopee",
  targetMarket: [],
  costPrice: "",
  salePrice: "",
  shippingCost: "",
  supplierUrl: "",
  image: "",
  stock: "",
  notes: "",
  status: "待上架",
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleMarket(code: string) {
    setForm((f) => ({
      ...f,
      targetMarket: f.targetMarket.includes(code)
        ? f.targetMarket.filter((c) => c !== code)
        : [...f.targetMarket, code],
    }));
    if (errors.targetMarket) setErrors((e) => ({ ...e, targetMarket: undefined }));
  }

  /** Live profit preview using same model as derived.ts */
  const preview = useMemo(() => {
    const cost = parseFloat(form.costPrice) || 0;
    const sale = parseFloat(form.salePrice) || 0;
    const ship = parseFloat(form.shippingCost) || 0;
    if (sale <= 0) return null;
    const ghost: MockProduct = {
      id: "preview",
      name: "preview",
      category: form.category,
      platform: form.platform,
      image: "",
      costPrice: cost,
      salePrice: sale,
      shippingCost: ship,
      commissionRate: DEFAULT_COMMISSION[form.platform],
      monthlySales: 0,
      rating: 0,
      reviewCount: 0,
      supplier: "",
      targetMarket: form.targetMarket,
      status: form.status,
      createdAt: new Date().toISOString(),
    };
    return computeProfit(ghost);
  }, [form]);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "请输入产品名称";
    else if (form.name.trim().length > 100) errs.name = "产品名称不超过 100 字";
    if (!form.category) errs.category = "请选择产品类目";
    if (!form.platform) errs.platform = "请选择目标平台";
    if (form.targetMarket.length === 0) errs.targetMarket = "请至少选择一个目标市场";

    const cost = parseFloat(form.costPrice);
    if (Number.isNaN(cost) || cost <= 0) errs.costPrice = "采购价必须大于 0";

    const sale = parseFloat(form.salePrice);
    if (Number.isNaN(sale) || sale <= 0) errs.salePrice = "建议售价必须大于 0";

    if (form.shippingCost) {
      const ship = parseFloat(form.shippingCost);
      if (Number.isNaN(ship) || ship < 0) errs.shippingCost = "运费不能为负数";
    }

    if (form.supplierUrl && !isLikelyUrl(form.supplierUrl))
      errs.supplierUrl = "供应商链接格式不正确";
    if (form.image && !isLikelyUrl(form.image)) errs.image = "图片链接格式不正确";

    if (form.stock) {
      const stock = parseInt(form.stock, 10);
      if (Number.isNaN(stock) || stock < 0) errs.stock = "库存必须为 0 或正整数";
    }

    if (form.notes.length > 500) errs.notes = "备注请控制在 500 字以内";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // scroll to first error
      const first = document.querySelector("[data-has-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const id = generateMockProductId();
    const product: MockProduct = {
      id,
      name: form.name.trim(),
      category: form.category,
      platform: form.platform,
      image:
        form.image.trim() ||
        `https://picsum.photos/seed/${encodeURIComponent(id)}/400/400`,
      costPrice: parseFloat(form.costPrice),
      salePrice: parseFloat(form.salePrice),
      shippingCost: form.shippingCost ? parseFloat(form.shippingCost) : 0,
      commissionRate: DEFAULT_COMMISSION[form.platform],
      monthlySales: 0,
      rating: 0,
      reviewCount: 0,
      supplier: extractSupplierName(form.supplierUrl) || "未填写",
      targetMarket: form.targetMarket,
      status: form.status,
      createdAt: now,
      updatedAt: now,
      supplierUrl: form.supplierUrl.trim() || undefined,
      stock: form.stock ? parseInt(form.stock, 10) : undefined,
      notes: form.notes.trim() || undefined,
    };
    const savedProduct = await createApiProduct(product);
    upsertMockProduct(savedProduct ?? product);
    logActivity({
      type: "product_created",
      productId: savedProduct?.id ?? id,
      productName: savedProduct?.name ?? product.name,
      detail: `新建产品并设为「${savedProduct?.status ?? product.status}」`,
    });
    router.push(`/products/${savedProduct?.id ?? id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 fade-in">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-[13px] text-apple-gray-300 hover:text-apple-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回产品库
      </Link>

      <PageHeader
        icon={Plus}
        title="新建产品"
        description="填写基础资料，提交后会自动进入产品详情页继续完善评分与文案。"
      />

      {/* === 基础信息 === */}
      <SectionCard title="基础信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="产品名称" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="例如：304不锈钢真空保温杯 500ml"
              className={inputCls}
            />
          </Field>
          <Field label="产品类目" required error={errors.category}>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputCls}
            >
              {MOCK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="目标平台" required error={errors.platform}>
            <select
              value={form.platform}
              onChange={(e) => update("platform", e.target.value as ProductPlatform)}
              className={inputCls}
            >
              {MOCK_PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="状态">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as ProductStatus)}
              className={inputCls}
            >
              {MOCK_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="目标市场" required error={errors.targetMarket} className="md:col-span-2">
            <MarketPicker selected={form.targetMarket} onToggle={toggleMarket} />
          </Field>
        </div>
      </SectionCard>

      {/* === 价格与物流 === */}
      <SectionCard title="价格与物流" description="价格全部按下单地货币填写：采购 / 运费用人民币，建议售价用美元。">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="采购价 (CNY)" required error={errors.costPrice}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice}
              onChange={(e) => update("costPrice", e.target.value)}
              placeholder="18.50"
              className={inputCls}
            />
          </Field>
          <Field label="建议售价 (USD)" required error={errors.salePrice}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(e) => update("salePrice", e.target.value)}
              placeholder="9.99"
              className={inputCls}
            />
          </Field>
          <Field label="运费 (CNY)" error={errors.shippingCost}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.shippingCost}
              onChange={(e) => update("shippingCost", e.target.value)}
              placeholder="6.20"
              className={inputCls}
            />
          </Field>
        </div>

        {preview && (
          <div className="mt-4 rounded-xl bg-apple-gray-50/70 border border-apple-gray-100 px-4 py-3 flex items-center gap-3 flex-wrap text-[12.5px]">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <span className="text-apple-gray-300">实时利润预估：</span>
            <span className="text-apple-gray-900">
              单件毛利 <strong className="tabular-nums">{formatUsd(preview.profitUsd, 2)}</strong>
            </span>
            <span className="text-apple-gray-300">·</span>
            <span
              className={
                preview.margin >= 0.4
                  ? "text-apple-green font-medium"
                  : preview.margin >= 0.2
                  ? "text-apple-gray-900 font-medium"
                  : "text-apple-red font-medium"
              }
            >
              毛利率 <span className="tabular-nums">{formatPct(preview.margin, 1)}</span>
            </span>
            <span className="ml-auto text-apple-gray-300">
              已扣除 {Math.round(DEFAULT_COMMISSION[form.platform] * 100)}% 平台佣金
            </span>
          </div>
        )}
      </SectionCard>

      {/* === 供应链 & 其他 === */}
      <SectionCard title="供应链 & 其他">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="供应商链接 (1688 / 拼多多 / 阿里国际)" error={errors.supplierUrl}>
            <input
              value={form.supplierUrl}
              onChange={(e) => update("supplierUrl", e.target.value)}
              placeholder="https://detail.1688.com/offer/xxx.html"
              className={inputCls}
            />
          </Field>
          <Field label="产品图片链接" error={errors.image}>
            <input
              value={form.image}
              onChange={(e) => update("image", e.target.value)}
              placeholder="https://example.com/product.jpg"
              className={inputCls}
            />
          </Field>
          <Field label="库存" error={errors.stock}>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              placeholder="500"
              className={inputCls}
            />
          </Field>
          <Field
            label="备注"
            error={errors.notes}
            hint={`${form.notes.length} / 500`}
            className="md:col-span-2"
          >
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="例如：旺季时间、客单价策略、爆点卖点等"
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* === Actions === */}
      <div className="flex items-center justify-end gap-3 sticky bottom-3 sm:bottom-4">
        <Link
          href="/products"
          className="px-5 py-2.5 rounded-xl text-[13px] text-apple-gray-900 bg-white border border-apple-gray-100 hover:bg-apple-gray-50 transition shadow-soft"
        >
          取消
        </Link>
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "保存中…" : "保存并进入详情"}
        </Button>
      </div>
    </form>
  );
}

/* ============================================================
 *  Sub-components
 * ============================================================ */

function MarketPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const sea = MOCK_MARKET_OPTIONS.filter((m) => m.region === "SEA");
  const global = MOCK_MARKET_OPTIONS.filter((m) => m.region === "Global");
  return (
    <div className="space-y-3">
      <MarketGroup title="东南亚" options={sea} selected={selected} onToggle={onToggle} />
      <MarketGroup title="全球" options={global} selected={selected} onToggle={onToggle} />
    </div>
  );
}

function MarketGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { code: string; label: string }[];
  selected: string[];
  onToggle: (code: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-apple-gray-300 mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o.code);
          return (
            <button
              type="button"
              key={o.code}
              onClick={() => onToggle(o.code)}
              className={[
                "px-3 py-1.5 rounded-xl text-[12px] font-medium transition border",
                active
                  ? "bg-apple-blue text-white border-apple-blue"
                  : "bg-apple-gray-50 text-apple-gray-300 border-apple-gray-100 hover:bg-apple-gray-100",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-apple-gray-50 rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30 transition";

function Field({
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-has-error={!!error} className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[12px] text-apple-gray-300">
          {label}
          {required && <span className="text-apple-red ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[11px] text-apple-gray-300">{hint}</span>}
      </div>
      {children}
      {error && <div className="text-[11px] text-apple-red mt-1">{error}</div>}
    </div>
  );
}

function isLikelyUrl(s: string): boolean {
  const t = s.trim();
  return /^https?:\/\/.+/i.test(t);
}

function extractSupplierName(url: string): string {
  try {
    if (!url) return "";
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
