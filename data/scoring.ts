/**
 * Phase 4 — 九宫格选品评分
 *
 * Independent of the legacy scoring system in `lib/scoring.ts` (which is still
 * used by `app/products/[id]/ScoringTab.tsx`). This module powers the
 * dedicated `/scoring` page with its own 9 dimensions and recommendation
 * tiers. Records are persisted to `seapick:scoringRecords` and grow over
 * time as the user re-evaluates products.
 */

import {
  TrendingUp,
  Swords,
  Coins,
  Truck,
  PackageCheck,
  RefreshCcw,
  Megaphone,
  Target,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { getStorageData, setStorageData } from "@/lib/storage";

/* ============================================================
 *  Dimensions
 * ============================================================ */

export const SCORING_DIMENSION_KEYS = [
  "marketDemand",
  "competitionIntensity",
  "profitMargin",
  "logisticsDifficulty",
  "supplyChainStability",
  "repurchasePotential",
  "contentMarketingPotential",
  "platformFit",
  "riskCompliance",
] as const;

export type ScoringDimensionKey = (typeof SCORING_DIMENSION_KEYS)[number];

export type ScoringDimensions = Record<ScoringDimensionKey, number>;

export interface ScoringDimensionMeta {
  key: ScoringDimensionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SCORING_DIMENSIONS: ScoringDimensionMeta[] = [
  {
    key: "marketDemand",
    label: "市场需求",
    description: "目标市场对该品类的真实需求规模与购买意愿。分越高代表需求越旺盛、用户基数越大。",
    icon: TrendingUp,
  },
  {
    key: "competitionIntensity",
    label: "竞争强度",
    description: "在售卖家数量与头部集中度。竞争越激烈分越低，蓝海赛道分越高。",
    icon: Swords,
  },
  {
    key: "profitMargin",
    label: "利润空间",
    description: "扣除采购、运费、佣金、广告与退货后的真实毛利空间。分越高利润越稳。",
    icon: Coins,
  },
  {
    key: "logisticsDifficulty",
    label: "物流难度",
    description: "重量 / 体积 / 易碎度 / 跨境运输方案的好坏。分越高代表物流越好处理。",
    icon: Truck,
  },
  {
    key: "supplyChainStability",
    label: "供应链稳定性",
    description: "供应商交期、产能、品控与备货能力。分越高越省心。",
    icon: PackageCheck,
  },
  {
    key: "repurchasePotential",
    label: "复购潜力",
    description: "用户回购周期与单客 LTV。消耗 / 周边 / 季节复购越高分越高。",
    icon: RefreshCcw,
  },
  {
    key: "contentMarketingPotential",
    label: "内容营销潜力",
    description: "适合短视频 / 直播 / 网红种草的程度。分越高内容种草效果越好。",
    icon: Megaphone,
  },
  {
    key: "platformFit",
    label: "平台适配度",
    description: "与目标平台规则、用户画像、流量分发逻辑的匹配度。分越高越容易起量。",
    icon: Target,
  },
  {
    key: "riskCompliance",
    label: "风险合规程度",
    description: "平台政策、目标国海关 / 认证、宗教文化适配。分越高合规风险越小。",
    icon: ShieldCheck,
  },
];

export const DEFAULT_SCORING: ScoringDimensions = {
  marketDemand: 5,
  competitionIntensity: 5,
  profitMargin: 5,
  logisticsDifficulty: 5,
  supplyChainStability: 5,
  repurchasePotential: 5,
  contentMarketingPotential: 5,
  platformFit: 5,
  riskCompliance: 5,
};

/* ============================================================
 *  Recommendation tiers (Phase 4 rules)
 * ============================================================ */

export type RecommendationLevel = "high" | "medium" | "low";

export interface RecommendationMeta {
  level: RecommendationLevel;
  label: string;
  action: string;
  tip: string;
  tone: "green" | "orange" | "red";
}

export const SCORING_RECOMMENDATION: Record<RecommendationLevel, RecommendationMeta> = {
  high: {
    level: "high",
    label: "高潜力",
    action: "建议重点测试",
    tip: "九维均衡走高，处于加投窗口。可立即启动多语言文案与短视频测试，把预算向头部 SKU 倾斜。",
    tone: "green",
  },
  medium: {
    level: "medium",
    label: "中等潜力",
    action: "建议小批量测试",
    tip: "存在 1-2 个短板需要补齐，建议先用 200-500 单的小规模铺货跑数据，验证后再决定是否加注。",
    tone: "orange",
  },
  low: {
    level: "low",
    label: "暂不建议投入",
    action: "暂停推进",
    tip: "多个维度偏低，强行推进容易造成预算浪费。建议先把短板维度的实际原因列出来再决定。",
    tone: "red",
  },
};

/* ============================================================
 *  Computation
 * ============================================================ */

export function calculateScoringTotal(scores: ScoringDimensions): number {
  return SCORING_DIMENSION_KEYS.reduce((sum, k) => sum + scores[k], 0);
}

export function calculateScoringAverage(scores: ScoringDimensions): number {
  const total = calculateScoringTotal(scores);
  return Math.round((total / SCORING_DIMENSION_KEYS.length) * 10) / 10;
}

export function getScoringRecommendation(avg: number): RecommendationMeta {
  if (avg >= 8) return SCORING_RECOMMENDATION.high;
  if (avg >= 6) return SCORING_RECOMMENDATION.medium;
  return SCORING_RECOMMENDATION.low;
}

/** Visual accent for a single dimension cell, by its current score. */
export function getCellTone(score: number): "red" | "orange" | "blue" | "green" {
  if (score <= 3) return "red";
  if (score <= 5) return "orange";
  if (score <= 7) return "blue";
  return "green";
}

/* ============================================================
 *  Scoring records (persisted history)
 * ============================================================ */

export interface ScoringRecord {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  scores: ScoringDimensions;
  total: number;
  average: number;
  recommendationLevel: RecommendationLevel;
  createdAt: string;
}

const STORAGE_KEY = "seapick:scoringRecords";

/** Seeded history so the page renders meaningful records out of the box. */
const SEED_RECORDS: ScoringRecord[] = [
  {
    id: "sr-seed-1",
    productId: "sp-1001",
    productName: "304不锈钢真空保温杯 500ml",
    productImage: "https://picsum.photos/seed/seapick-1001/400/400",
    scores: {
      marketDemand: 8,
      competitionIntensity: 6,
      profitMargin: 8,
      logisticsDifficulty: 7,
      supplyChainStability: 9,
      repurchasePotential: 6,
      contentMarketingPotential: 7,
      platformFit: 8,
      riskCompliance: 9,
    },
    total: 68,
    average: 7.6,
    recommendationLevel: "medium",
    createdAt: "2026-05-09T11:05:00.000Z",
  },
  {
    id: "sr-seed-2",
    productId: "sp-1003",
    productName: "记忆棉折叠人体工学颈枕（U型）",
    productImage: "https://picsum.photos/seed/seapick-1003/400/400",
    scores: {
      marketDemand: 9,
      competitionIntensity: 5,
      profitMargin: 8,
      logisticsDifficulty: 8,
      supplyChainStability: 8,
      repurchasePotential: 5,
      contentMarketingPotential: 9,
      platformFit: 9,
      riskCompliance: 8,
    },
    total: 69,
    average: 7.7,
    recommendationLevel: "medium",
    createdAt: "2026-05-12T13:42:00.000Z",
  },
  {
    id: "sr-seed-3",
    productId: "sp-1011",
    productName: "真丝降噪睡眠眼罩",
    productImage: "https://picsum.photos/seed/seapick-1011/400/400",
    scores: {
      marketDemand: 8,
      competitionIntensity: 5,
      profitMargin: 9,
      logisticsDifficulty: 9,
      supplyChainStability: 8,
      repurchasePotential: 7,
      contentMarketingPotential: 8,
      platformFit: 8,
      riskCompliance: 9,
    },
    total: 71,
    average: 7.9,
    recommendationLevel: "medium",
    createdAt: "2026-05-04T10:18:00.000Z",
  },
  {
    id: "sr-seed-4",
    productId: "sp-1004",
    productName: "高弹力高腰瑜伽裤 蜜桃臀塑形款",
    productImage: "https://picsum.photos/seed/seapick-1004/400/400",
    scores: {
      marketDemand: 8,
      competitionIntensity: 4,
      profitMargin: 6,
      logisticsDifficulty: 8,
      supplyChainStability: 7,
      repurchasePotential: 6,
      contentMarketingPotential: 9,
      platformFit: 8,
      riskCompliance: 8,
    },
    total: 64,
    average: 7.1,
    recommendationLevel: "medium",
    createdAt: "2026-04-22T07:30:00.000Z",
  },
  {
    id: "sr-seed-5",
    productId: "sp-1014",
    productName: "北欧风简约陶瓷餐具套装（8 件）",
    productImage: "https://picsum.photos/seed/seapick-1014/400/400",
    scores: {
      marketDemand: 5,
      competitionIntensity: 5,
      profitMargin: 5,
      logisticsDifficulty: 3,
      supplyChainStability: 4,
      repurchasePotential: 4,
      contentMarketingPotential: 6,
      platformFit: 5,
      riskCompliance: 6,
    },
    total: 43,
    average: 4.8,
    recommendationLevel: "low",
    createdAt: "2026-04-02T15:18:00.000Z",
  },
  {
    id: "sr-seed-6",
    productId: "sp-1008",
    productName: "智能定时宠物自动喂食器 4L 大容量",
    productImage: "https://picsum.photos/seed/seapick-1008/400/400",
    scores: {
      marketDemand: 8,
      competitionIntensity: 6,
      profitMargin: 8,
      logisticsDifficulty: 5,
      supplyChainStability: 7,
      repurchasePotential: 7,
      contentMarketingPotential: 8,
      platformFit: 8,
      riskCompliance: 8,
    },
    total: 65,
    average: 7.2,
    recommendationLevel: "medium",
    createdAt: "2026-05-10T09:00:00.000Z",
  },
];

export function getScoringRecords(): ScoringRecord[] {
  const data = getStorageData<ScoringRecord[] | null>(STORAGE_KEY, null);
  if (data && data.length > 0) return data;
  setStorageData(STORAGE_KEY, SEED_RECORDS);
  return SEED_RECORDS;
}

export function getScoringRecordsByProduct(productId: string): ScoringRecord[] {
  return getScoringRecords()
    .filter((r) => r.productId === productId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function addScoringRecord(
  input: Omit<ScoringRecord, "id" | "createdAt">
): ScoringRecord {
  const record: ScoringRecord = {
    ...input,
    id: `sr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...getScoringRecords()].slice(0, 200);
  setStorageData(STORAGE_KEY, next);
  return record;
}

export function deleteScoringRecord(id: string): void {
  const next = getScoringRecords().filter((r) => r.id !== id);
  setStorageData(STORAGE_KEY, next);
}

/* ============================================================
 *  Suggestion synthesis (drives the AI 分析建议 panel)
 * ============================================================ */

export interface ScoringSuggestion {
  title: string;
  body: string;
  tone: "green" | "blue" | "orange" | "red";
}

export function buildScoringSuggestions(
  scores: ScoringDimensions
): ScoringSuggestion[] {
  const dims = SCORING_DIMENSIONS.map((d) => ({ ...d, value: scores[d.key] }));
  const sorted = [...dims].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 2);
  const bottom = sorted.slice(-2).reverse(); // weakest first
  const avg = calculateScoringAverage(scores);
  const suggestions: ScoringSuggestion[] = [];

  // Strength callout
  suggestions.push({
    title: `优势集中在「${top.map((d) => d.label).join(" + ")}」`,
    body: `${top[0].label} ${top[0].value} 分、${top[1].label} ${top[1].value} 分，建议把它们写进主图卖点与短视频前 3 秒钩子。`,
    tone: "green",
  });

  // Weakness callout
  suggestions.push({
    title: `短板是「${bottom.map((d) => d.label).join(" / ")}」`,
    body: `${bottom[0].label} 仅 ${bottom[0].value} 分，是当前最大的风险点。在加大投入前，请先把这一维度的实际原因排查清楚。`,
    tone: bottom[0].value <= 3 ? "red" : "orange",
  });

  // Cross-dim heuristic — blue ocean
  if (scores.competitionIntensity <= 5 && scores.marketDemand >= 7) {
    suggestions.push({
      title: "蓝海机会窗口",
      body: "需求旺盛但竞争不算激烈，建议立即铺货抢首发期，先把核心关键词的搜索结果占满。",
      tone: "blue",
    });
  }

  // Cross-dim heuristic — high content potential
  if (scores.contentMarketingPotential >= 8) {
    suggestions.push({
      title: "适合优先做短视频",
      body: "内容营销潜力 ≥ 8 分，建议立刻启动 TikTok / Reels 短视频脚本：3 个角度 × 3 个版本做 A/B 测试。",
      tone: "blue",
    });
  }

  // Cross-dim — high repurchase
  if (scores.repurchasePotential >= 7) {
    suggestions.push({
      title: "搭建私域抓复购",
      body: "复购潜力较强，建议在订单确认页 / 包装内放 LINE / WhatsApp 二维码，把首单客户沉淀到私域。",
      tone: "blue",
    });
  }

  // Profit can cover logistics
  if (scores.profitMargin >= 7 && scores.logisticsDifficulty <= 4) {
    suggestions.push({
      title: "利润足够覆盖复杂物流",
      body: "毛利空间足以消化高物流成本，建议谈海外仓 / 本地承运，把单票运费压下来再投流。",
      tone: "blue",
    });
  }

  // Compliance red flag
  if (scores.riskCompliance <= 4) {
    suggestions.push({
      title: "合规风险偏高",
      body: "请优先确认目标国的认证 / 海关 / 平台政策，避免链接被下架或店铺扣分。",
      tone: "red",
    });
  }

  // Overall summary
  if (avg < 6) {
    suggestions.push({
      title: "整体建议：暂缓推进",
      body: "多个维度处于低位，强行加投容易造成预算浪费。建议先做产品改良或换品。",
      tone: "red",
    });
  } else if (avg >= 8) {
    suggestions.push({
      title: "整体建议：进入冲量节奏",
      body: "九个维度都在健康线以上，可以把这款 SKU 写进本月主推清单，跨平台同步铺货。",
      tone: "green",
    });
  }

  return suggestions.slice(0, 5);
}
