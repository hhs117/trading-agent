/**
 * Derived metrics for MockProduct
 *
 * Pure functions only — no IO. Pages should compute on-the-fly with
 * `useMemo` rather than persisting these to storage.
 */

import type { MockProduct, ProductPlatform } from "./mockData";

/** Rough constant USD↔CNY rate used to normalise the model. */
export const CNY_PER_USD = 7.2;

export interface ProfitBreakdown {
  /** unit cost in USD (cost + shipping converted from CNY) */
  unitCostUsd: number;
  /** platform commission in USD */
  commissionUsd: number;
  /** profit per unit in USD */
  profitUsd: number;
  /** margin as 0-1 */
  margin: number;
  /** projected monthly profit in USD */
  monthlyProfitUsd: number;
}

export function computeProfit(p: MockProduct): ProfitBreakdown {
  const unitCostUsd = (p.costPrice + p.shippingCost) / CNY_PER_USD;
  const commissionUsd = p.salePrice * p.commissionRate;
  const profitUsd = p.salePrice - unitCostUsd - commissionUsd;
  const margin = p.salePrice > 0 ? profitUsd / p.salePrice : 0;
  const monthlyProfitUsd = profitUsd * p.monthlySales;
  return { unitCostUsd, commissionUsd, profitUsd, margin, monthlyProfitUsd };
}

export function formatUsd(n: number, digits = 2): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(digits)}`;
}

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

/** 0-100 opportunity score blending profit, rating, sales, reviews and scoring. */
export function computeOpportunityScore(p: MockProduct): number {
  if (p.status === "下架" || p.status === "缺货") return 0;
  const { margin } = computeProfit(p);

  const profit = clamp(margin / 0.6, 0, 1) * 30; // <60% margin scales up to 30 pts
  const ratingPart = clamp((p.rating - 3) / 2, 0, 1) * 20; // ratings 3→5 map to 0→20
  const sales = Math.min(p.monthlySales / 5000, 1) * 30; // 5000+/month is full credit
  const reviews = Math.min(p.reviewCount / 3000, 1) * 10;
  const scored = p.totalScore ? clamp((p.totalScore - 5) / 5, 0, 1) * 10 : 0;

  return Math.round(profit + ratingPart + sales + reviews + scored);
}

/** Did the product trigger any risk signal worth surfacing on the dashboard? */
export function isAtRisk(p: MockProduct): boolean {
  if (p.status === "缺货" || p.status === "下架") return true;
  if (p.recommendation === "avoid") return true;
  if (p.rating < 3.8) return true;
  if (p.totalScore !== undefined && p.totalScore < 5) return true;
  return false;
}

/** Should we put this product into the "待优化" bucket? */
export function needsOptimization(p: MockProduct): boolean {
  if (p.status === "测试中") return true;
  if (p.recommendation === "caution") return true;
  if (p.rating < 4.5 && p.rating >= 3.8) return true;
  if (p.totalScore !== undefined && p.totalScore < 6.5 && p.totalScore >= 5) return true;
  return false;
}

export function isHighPotential(p: MockProduct): boolean {
  return computeOpportunityScore(p) >= 70 || p.recommendation === "recommend";
}

export interface PlatformSummary {
  platform: ProductPlatform;
  skuCount: number;
  monthlyUnits: number;
  monthlyProfitUsd: number;
  avgRating: number;
  recommendedCount: number;
}

export function summarizeByPlatform(products: MockProduct[]): PlatformSummary[] {
  const map = new Map<ProductPlatform, PlatformSummary>();
  products.forEach((p) => {
    const cur = map.get(p.platform) ?? {
      platform: p.platform,
      skuCount: 0,
      monthlyUnits: 0,
      monthlyProfitUsd: 0,
      avgRating: 0,
      recommendedCount: 0,
    };
    const { monthlyProfitUsd } = computeProfit(p);
    cur.skuCount += 1;
    cur.monthlyUnits += p.monthlySales;
    cur.monthlyProfitUsd += monthlyProfitUsd;
    cur.avgRating += p.rating;
    if (p.recommendation === "recommend") cur.recommendedCount += 1;
    map.set(p.platform, cur);
  });

  for (const v of Array.from(map.values())) {
    v.avgRating = v.skuCount > 0 ? +(v.avgRating / v.skuCount).toFixed(2) : 0;
  }
  return Array.from(map.values());
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
