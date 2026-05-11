"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { generateId, upsertProduct } from "@/lib/storage";
import { CATEGORIES, COUNTRY_LABELS, type Country, type Platform, type Product } from "@/lib/types";

const PLATFORMS: Platform[] = ["Shopee", "Lazada", "TikTok Shop"];
const COUNTRIES: Country[] = ["TH", "VN", "ID", "MY", "PH", "SG"];

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    platform: "Shopee" as Platform,
    targetCountries: [] as Country[],
    category: CATEGORIES[0],
    costPrice: 0,
    sellPrice: 0,
    weight: 0,
    supplierUrl: "",
    competitorUrl: "",
    imageUrls: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCountry(c: Country) {
    setForm((f) => ({
      ...f,
      targetCountries: f.targetCountries.includes(c)
        ? f.targetCountries.filter((x) => x !== c)
        : [...f.targetCountries, c],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "请输入产品名称";
    if (form.targetCountries.length === 0) errs.targetCountries = "请至少选择一个目标国家";
    if (form.costPrice < 0) errs.costPrice = "成本价不能为负";
    if (form.sellPrice < 0) errs.sellPrice = "售价不能为负";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const now = new Date().toISOString();
    const product: Product = {
      id: generateId(),
      name: form.name.trim(),
      platform: form.platform,
      targetCountries: form.targetCountries,
      category: form.category,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      weight: Number(form.weight),
      supplierUrl: form.supplierUrl.trim(),
      competitorUrl: form.competitorUrl.trim(),
      imageUrls: form.imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    upsertProduct(product);
    router.push(`/products/${product.id}`);
  }

  const margin =
    form.sellPrice > 0
      ? Math.round(((form.sellPrice - form.costPrice) / form.sellPrice) * 100)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 fade-in">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-[13px] text-apple-gray-300 hover:text-apple-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回产品库
      </Link>

      {/* 基础信息 */}
      <Card>
        <CardHeader title="基础信息" />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="产品名称" required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="如：便携式迷你USB风扇"
              className={inputCls}
            />
          </Field>
          <Field label="平台">
            <select
              value={form.platform}
              onChange={(e) => update("platform", e.target.value as Platform)}
              className={inputCls}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="品类">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="目标国家" required error={errors.targetCountries}>
            <div className="flex flex-wrap gap-2 pt-1">
              {COUNTRIES.map((c) => {
                const active = form.targetCountries.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCountry(c)}
                    className={[
                      "px-3 py-1.5 rounded-xl text-[12px] font-medium transition",
                      active
                        ? "bg-apple-blue text-white"
                        : "bg-apple-gray-50 text-apple-gray-300 hover:bg-apple-gray-100",
                    ].join(" ")}
                  >
                    {COUNTRY_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </Field>
        </CardBody>
      </Card>

      {/* 价格与物流 */}
      <Card>
        <CardHeader title="价格与物流" />
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="成本价 (元)" error={errors.costPrice}>
            <input
              type="number"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => update("costPrice", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="售价 (元)" error={errors.sellPrice}>
            <input
              type="number"
              step="0.01"
              value={form.sellPrice}
              onChange={(e) => update("sellPrice", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="重量 (kg)">
            <input
              type="number"
              step="0.01"
              value={form.weight}
              onChange={(e) => update("weight", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-3">
            <div className="rounded-xl bg-apple-gray-50 px-4 py-3 text-[13px] text-apple-gray-300 flex items-center gap-2">
              <span>预估毛利率：</span>
              <span
                className={[
                  "font-semibold",
                  margin > 50 ? "text-apple-green" : margin > 30 ? "text-apple-orange" : "text-apple-red",
                ].join(" ")}
              >
                {margin}%
              </span>
              <span className="ml-auto text-[12px]">建议毛利率 ≥ 50% 以覆盖广告与物流</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 链接信息 */}
      <Card>
        <CardHeader title="链接信息" />
        <CardBody className="grid grid-cols-1 gap-5">
          <Field label="供应商链接（1688/拼多多等）">
            <input
              value={form.supplierUrl}
              onChange={(e) => update("supplierUrl", e.target.value)}
              placeholder="https://"
              className={inputCls}
            />
          </Field>
          <Field label="竞品链接">
            <input
              value={form.competitorUrl}
              onChange={(e) => update("competitorUrl", e.target.value)}
              placeholder="https://"
              className={inputCls}
            />
          </Field>
          <Field label="产品图片链接（每行一个）">
            <textarea
              rows={3}
              value={form.imageUrls}
              onChange={(e) => update("imageUrls", e.target.value)}
              placeholder="https://example.com/img1.jpg"
              className={inputCls}
            />
          </Field>
          <Field label="备注">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="如：旺季时间、目标客单价、推广策略等"
              className={inputCls}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/products"
          className="px-5 py-2.5 rounded-xl text-[13px] text-apple-gray-900 bg-apple-gray-50 hover:bg-apple-gray-100 transition"
        >
          取消
        </Link>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white bg-apple-blue hover:bg-blue-600 transition"
        >
          保存并打分
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full bg-apple-gray-50 rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30 transition";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] text-apple-gray-300 mb-1.5">
        {label}
        {required && <span className="text-apple-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <div className="text-[11px] text-apple-red mt-1">{error}</div>}
    </div>
  );
}
