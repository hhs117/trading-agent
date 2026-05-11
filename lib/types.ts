export type Platform = "Shopee" | "Lazada" | "TikTok Shop";
export type Country = "TH" | "VN" | "ID" | "MY" | "PH" | "SG";
export type Language = "en" | "th" | "vi" | "id" | "ms";
export type Recommendation = "recommend" | "caution" | "avoid";

export interface ScoreDimensions {
  marketHeat: number;
  demandGrowth: number;
  competitionPressure: number;
  priceCompetition: number;
  profitFeasibility: number;
  keywordTraffic: number;
  competitorMaturity: number;
  supplyLogistics: number;
  complianceLocalization: number;
}

export interface Copywriting {
  language: Language;
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
}

export interface ImageReview {
  imageUrl: string;
  hasChinese: boolean;
  isCluttered: boolean;
  hasSellingPoint: boolean;
  localizationTip: string;
  ctrTip: string;
}

export interface Product {
  id: string;
  name: string;
  platform: Platform;
  targetCountries: Country[];
  category: string;
  costPrice: number;
  sellPrice: number;
  weight: number;
  supplierUrl: string;
  competitorUrl: string;
  imageUrls: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  score?: ScoreDimensions;
  totalScore?: number;
  recommendation?: Recommendation;
  copywritings?: Copywriting[];
  imageReviews?: ImageReview[];
}

export const COUNTRY_LABELS: Record<Country, string> = {
  TH: "泰国",
  VN: "越南",
  ID: "印尼",
  MY: "马来西亚",
  PH: "菲律宾",
  SG: "新加坡",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
};

export const SCORE_DIMENSION_LABELS: Record<keyof ScoreDimensions, string> = {
  marketHeat: "市场热度分",
  demandGrowth: "需求增长分",
  competitionPressure: "竞争压力分",
  priceCompetition: "价格竞争分",
  profitFeasibility: "利润可行分",
  keywordTraffic: "关键词流量分",
  competitorMaturity: "竞品成熟度分",
  supplyLogistics: "供应链物流分",
  complianceLocalization: "合规本地化分",
};

export const SCORE_DIMENSION_DESCRIPTIONS: Record<keyof ScoreDimensions, string> = {
  marketHeat:
    "近 90 天该品类整体销量、搜索热度与新店入驻表现。分越高代表市场越热。",
  demandGrowth:
    "需求的同比/环比增长趋势。是否处在上升期？分越高代表趋势越好。",
  competitionPressure:
    "在售卖家数量与头部集中度。竞争越激烈分越低；蓝海赛道分越高。",
  priceCompetition:
    "价格带是否拥挤、是否有差异化定价空间。分越高代表越容易定出溢价。",
  profitFeasibility:
    "扣除采购、头程、平台佣金、广告、退货后的真实利润可行度。分越高利润越稳。",
  keywordTraffic:
    "核心关键词的搜索量与点击潜力。流量越大、CPC 越合理分越高。",
  competitorMaturity:
    "TOP 卖家上架时长、评论数、店铺评分。竞品越成熟切入越难，分越低。",
  supplyLogistics:
    "货源稳定性、重量/体积/破损风险、海外仓覆盖。分越高物流越省心。",
  complianceLocalization:
    "平台政策、海关清关、目标国认证及宗教文化适配。分越高合规风险越小。",
};

export const CATEGORIES = [
  "服饰配件",
  "美妆个护",
  "数码电子",
  "家居生活",
  "母婴玩具",
  "运动户外",
  "食品饮料",
  "宠物用品",
  "其他",
];
