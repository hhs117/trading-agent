"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Star,
  Calculator,
  Lightbulb,
  Eye,
  Trash2,
  MoreHorizontal,
  X,
  Grid3x3,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/EmptyState";
import { LinkButton } from "@/components/ui/Button";

import {
  deleteMockProduct,
  MOCK_CATEGORIES,
  MOCK_PLATFORM_OPTIONS,
  MOCK_STATUS_OPTIONS,
  MOCK_MARKET_LABELS,
  STATUS_TONE,
  type MockProduct,
  type ProductStatus,
  type ProductPlatform,
} from "@/data/mockData";
import { computeProfit, formatPct } from "@/data/derived";
import { logActivity } from "@/data/activity";
import { deleteApiProduct, fetchApiProducts } from "@/lib/api/products";

const ALL = "" as const;

export default function ProductListPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-apple-gray-300">加载中…</div>}>
      <ProductListInner />
    </Suspense>
  );
}

function ProductListInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState<ProductPlatform | "">(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<ProductStatus | "">(
    (searchParams.get("status") as ProductStatus | null) ?? ALL
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const remoteProducts = await fetchApiProducts();
      if (!active) return;
      setProducts(remoteProducts ?? []);
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return products.filter((p) => {
      if (kw && !p.name.toLowerCase().includes(kw)) return false;
      if (platform && p.platform !== platform) return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [products, keyword, platform, category, status]);

  async function reload() {
    const remoteProducts = await fetchApiProducts();
    setProducts(remoteProducts ?? []);
  }

  async function handleDelete(p: MockProduct) {
    if (!confirm(`确认删除「${p.name}」？此操作不可撤销。`)) return;
    await deleteApiProduct(p.id);
    deleteMockProduct(p.id);
    logActivity({
      type: "product_deleted",
      productId: p.id,
      productName: p.name,
    });
    setProducts((current) => current.filter((item) => item.id !== p.id));
    void reload();
    setOpenMenuId(null);
  }

  const hasActiveFilter = !!keyword || !!platform || !!category || !!status;

  function resetFilters() {
    setKeyword("");
    setPlatform(ALL);
    setCategory(ALL);
    setStatus(ALL);
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        icon={Package}
        title="产品库"
        description={`共 ${products.length} 个产品，筛选后 ${filtered.length} 个。`}
        action={
          <LinkButton href="/products/new" icon={Plus}>
            新建产品
          </LinkButton>
        }
      />

      {/* ===== Filters ===== */}
      <SectionCard bodyClassName="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_repeat(3,1fr)_auto] gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-300" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索产品名称…"
              className="w-full bg-apple-gray-50 rounded-xl py-2.5 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
            />
          </div>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ProductPlatform | "")}
            className="bg-apple-gray-50 rounded-xl py-2.5 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有平台</option>
            {MOCK_PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-apple-gray-50 rounded-xl py-2.5 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有品类</option>
            {MOCK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus | "")}
            className="bg-apple-gray-50 rounded-xl py-2.5 px-3 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
          >
            <option value="">所有状态</option>
            {MOCK_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilter}
            className="inline-flex items-center justify-center gap-1 text-[12.5px] text-apple-gray-300 hover:text-apple-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition px-3"
          >
            <X className="w-3.5 h-3.5" /> 重置
          </button>
        </div>
      </SectionCard>

      {/* ===== Table ===== */}
      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Package}
            title={hasActiveFilter ? "没有匹配的产品" : "还没有任何产品"}
            description={
              hasActiveFilter
                ? "调整筛选条件，或者重置后再看一次。"
                : "添加你的第一个产品开始评估。"
            }
            actionHref="/products/new"
            actionLabel="新建产品"
          />
        </SectionCard>
      ) : (
        <SectionCard bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-apple-gray-50/70 text-apple-gray-300">
                <tr>
                  <Th>产品</Th>
                  <Th>平台</Th>
                  <Th>品类</Th>
                  <Th>目标市场</Th>
                  <Th align="right">售价</Th>
                  <Th align="right">毛利率</Th>
                  <Th align="right">月销</Th>
                  <Th align="center">评分</Th>
                  <Th align="center">状态</Th>
                  <Th align="right" className="pr-5">
                    操作
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {filtered.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    menuOpen={openMenuId === p.id}
                    onToggleMenu={() => setOpenMenuId((id) => (id === p.id ? null : p.id))}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onDelete={() => handleDelete(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ============================================================
 *  Row component (handles its own action-menu outside-click)
 * ============================================================ */

function ProductRow({
  product: p,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onDelete,
}: {
  product: MockProduct;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onDelete: () => void;
}) {
  const { margin } = computeProfit(p);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) onCloseMenu();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, onCloseMenu]);

  const marginTone = margin >= 0.4 ? "text-apple-green" : margin >= 0.2 ? "text-apple-gray-900" : "text-apple-red";

  return (
    <tr className="hover:bg-apple-gray-50/40 transition">
      <Td>
        <Link href={`/products/${p.id}`} className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.name}
            className="w-9 h-9 rounded-lg bg-apple-gray-50 object-cover shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-apple-gray-900 group-hover:text-apple-blue transition truncate max-w-[260px]">
              {p.name}
            </div>
            <div className="text-[11px] text-apple-gray-300 truncate max-w-[260px]">
              ID {p.id} · {p.supplier}
            </div>
          </div>
        </Link>
      </Td>
      <Td>{p.platform}</Td>
      <Td>{p.category}</Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {p.targetMarket.slice(0, 3).map((m) => (
            <span
              key={m}
              className="text-[11px] bg-apple-gray-50 text-apple-gray-300 rounded-md px-1.5 py-0.5"
            >
              {MOCK_MARKET_LABELS[m] ?? m}
            </span>
          ))}
          {p.targetMarket.length > 3 && (
            <span className="text-[11px] text-apple-gray-300">+{p.targetMarket.length - 3}</span>
          )}
        </div>
      </Td>
      <Td align="right" className="tabular-nums">
        ${p.salePrice.toFixed(2)}
      </Td>
      <Td align="right" className={["tabular-nums font-medium", marginTone].join(" ")}>
        {formatPct(margin, 1)}
      </Td>
      <Td align="right" className="tabular-nums">
        {p.monthlySales.toLocaleString()}
      </Td>
      <Td align="center" className="tabular-nums">
        <span className="inline-flex items-center gap-0.5">
          <Star className="w-3.5 h-3.5 text-apple-orange fill-apple-orange" />
          {p.rating.toFixed(1)}
        </span>
      </Td>
      <Td align="center">
        <Badge tone={STATUS_TONE[p.status]} size="sm">
          {p.status}
        </Badge>
      </Td>
      <Td align="right" className="pr-5">
        <div className="relative inline-block" ref={menuRef}>
          <button
            onClick={onToggleMenu}
            aria-label="操作"
            className="p-1.5 rounded-lg text-apple-gray-300 hover:text-apple-gray-900 hover:bg-apple-gray-50"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-apple-gray-100 rounded-xl shadow-hover py-1.5 z-10 text-[13px]">
              <MenuLink href={`/products/${p.id}`} icon={Eye} label="查看详情" />
              <MenuLink
                href={`/scoring?productId=${p.id}`}
                icon={Grid3x3}
                label="九宫格评分"
              />
              <MenuLink
                href={`/finance?productId=${p.id}`}
                icon={Calculator}
                label="利润计算"
              />
              <MenuLink
                href={`/optimization?productId=${p.id}`}
                icon={Lightbulb}
                label="产品优化"
              />
              <div className="h-px bg-apple-gray-100 my-1" />
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-apple-red hover:bg-apple-red/5 transition text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除
              </button>
            </div>
          )}
        </div>
      </Td>
    </tr>
  );
}

/* ============================================================
 *  Tiny presentational primitives kept local to this page
 * ============================================================ */

function Th({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={[
        "font-medium text-[11.5px] uppercase tracking-wider px-4 py-3 whitespace-nowrap",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={[
        "px-4 py-3 text-apple-gray-900 align-middle",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Eye;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-apple-gray-900 hover:bg-apple-gray-50 transition"
    >
      <Icon className="w-3.5 h-3.5 text-apple-gray-300" />
      {label}
    </Link>
  );
}
