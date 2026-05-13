export type PlatformName = "Shopee" | "Lazada" | "TikTok Shop" | "Amazon" | "Temu" | "AliExpress";
export type TrendDirection = "up" | "down" | "stable";
export type FitLevel = "high" | "medium" | "low";
export type RiskLevel = "low" | "medium" | "high";
export type CompetitionLevel = "low" | "medium" | "high";

export interface PlatformAnalytics {
  name: PlatformName;
  hotCategories: string[];
  averagePrice: number;
  competitorCount: number;
  estimatedSales: number;
  growthTrend: {
    direction: TrendDirection;
    yoy: number;
  };
  fit: FitLevel;
  risk: RiskLevel;
  suitableProducts: string[];
  categoryBoost: Record<string, number>;
}

export interface CompetitorItem {
  id: string;
  name: string;
  platform: PlatformName;
  price: number;
  monthlySales: number;
  rating: number;
  reviewCount: number;
  shippingFrom: string;
  sellingPoints: string[];
  competition: CompetitionLevel;
  estimatedProfitRate: number;
  recommendationIndex: number;
  keywords: string[];
}

export const PRODUCT_CATEGORIES = [
  "家居生活",
  "服饰配件",
  "美妆个护",
  "数码电子",
  "宠物用品",
  "运动户外",
  "母婴玩具",
  "厨房用品",
  "旅行收纳",
];

export const PLATFORMS: PlatformAnalytics[] = [
  {
    name: "Shopee",
    hotCategories: ["服饰配件", "美妆个护", "家居生活", "母婴玩具", "厨房用品"],
    averagePrice: 8.6,
    competitorCount: 1850000,
    estimatedSales: 7800000,
    growthTrend: { direction: "stable", yoy: 4 },
    fit: "high",
    risk: "low",
    suitableProducts: ["低客单快消", "轻小件", "本土化日用品", "节日促销品"],
    categoryBoost: { 服饰配件: 18, 美妆个护: 16, 家居生活: 14, 厨房用品: 12, 旅行收纳: 10 },
  },
  {
    name: "Lazada",
    hotCategories: ["数码电子", "家居生活", "美妆个护", "母婴玩具", "运动户外"],
    averagePrice: 14.2,
    competitorCount: 720000,
    estimatedSales: 3200000,
    growthTrend: { direction: "down", yoy: -6 },
    fit: "medium",
    risk: "medium",
    suitableProducts: ["中客单精品", "3C 配件", "家居升级品", "品牌化套装"],
    categoryBoost: { 数码电子: 18, 家居生活: 14, 美妆个护: 12, 母婴玩具: 12, 运动户外: 10 },
  },
  {
    name: "TikTok Shop",
    hotCategories: ["美妆个护", "服饰配件", "家居生活", "旅行收纳", "宠物用品"],
    averagePrice: 12.4,
    competitorCount: 540000,
    estimatedSales: 4100000,
    growthTrend: { direction: "up", yoy: 38 },
    fit: "high",
    risk: "medium",
    suitableProducts: ["短视频爆款", "强视觉产品", "情绪价值商品", "达人带货款"],
    categoryBoost: { 美妆个护: 20, 服饰配件: 16, 旅行收纳: 15, 家居生活: 13, 宠物用品: 10 },
  },
  {
    name: "Amazon",
    hotCategories: ["家居生活", "数码电子", "运动户外", "宠物用品", "厨房用品"],
    averagePrice: 29.8,
    competitorCount: 2400000,
    estimatedSales: 22000000,
    growthTrend: { direction: "stable", yoy: 3 },
    fit: "medium",
    risk: "high",
    suitableProducts: ["品牌化精品", "高客单工具", "FBA 稳定供货", "合规认证产品"],
    categoryBoost: { 家居生活: 18, 数码电子: 15, 运动户外: 14, 宠物用品: 13, 厨房用品: 12 },
  },
  {
    name: "Temu",
    hotCategories: ["家居生活", "服饰配件", "厨房用品", "旅行收纳", "母婴玩具"],
    averagePrice: 5.9,
    competitorCount: 380000,
    estimatedSales: 5400000,
    growthTrend: { direction: "up", yoy: 62 },
    fit: "high",
    risk: "medium",
    suitableProducts: ["极致低价小件", "工厂直供 SKU", "组合装", "高频复购小物"],
    categoryBoost: { 家居生活: 18, 服饰配件: 14, 厨房用品: 15, 旅行收纳: 12, 母婴玩具: 10 },
  },
  {
    name: "AliExpress",
    hotCategories: ["数码电子", "服饰配件", "家居生活", "运动户外", "宠物用品"],
    averagePrice: 13.1,
    competitorCount: 950000,
    estimatedSales: 4800000,
    growthTrend: { direction: "stable", yoy: 2 },
    fit: "medium",
    risk: "low",
    suitableProducts: ["长尾品", "DIY 配件", "工具五金", "欧洲/拉美需求品"],
    categoryBoost: { 数码电子: 16, 服饰配件: 12, 家居生活: 10, 运动户外: 13, 宠物用品: 12 },
  },
];

export const COMPETITORS: CompetitorItem[] = [
  {
    id: "c-1001",
    name: "Portable Travel Organizer Bag Waterproof Foldable",
    platform: "TikTok Shop",
    price: 12.99,
    monthlySales: 5380,
    rating: 4.8,
    reviewCount: 3220,
    shippingFrom: "Los Angeles, US",
    sellingPoints: ["大容量", "防水面料", "可折叠", "旅行场景"],
    competition: "high",
    estimatedProfitRate: 28,
    recommendationIndex: 8,
    keywords: ["收纳包", "旅行收纳", "organizer", "travel bag", "foldable"],
  },
  {
    id: "c-1002",
    name: "Stainless Steel Vacuum Tumbler 500ml BPA Free",
    platform: "Shopee",
    price: 9.9,
    monthlySales: 2840,
    rating: 4.7,
    reviewCount: 1582,
    shippingFrom: "Yiwu, China",
    sellingPoints: ["304 不锈钢", "12 小时保温", "防漏杯盖", "多色可选"],
    competition: "medium",
    estimatedProfitRate: 32,
    recommendationIndex: 8,
    keywords: ["保温杯", "tumbler", "vacuum cup", "water bottle"],
  },
  {
    id: "c-1003",
    name: "Wireless Gaming Mouse RGB 2.4G Bluetooth Dual Mode",
    platform: "Lazada",
    price: 19.99,
    monthlySales: 1620,
    rating: 4.5,
    reviewCount: 894,
    shippingFrom: "Shenzhen, China",
    sellingPoints: ["双模连接", "RGB 灯效", "轻量化", "高 DPI"],
    competition: "medium",
    estimatedProfitRate: 24,
    recommendationIndex: 7,
    keywords: ["鼠标", "gaming mouse", "wireless mouse", "电竞"],
  },
  {
    id: "c-1004",
    name: "Silk Sleep Eye Mask Adjustable Strap Gift Box",
    platform: "Shopee",
    price: 6.99,
    monthlySales: 4720,
    rating: 4.7,
    reviewCount: 2980,
    shippingFrom: "Bangkok, Thailand",
    sellingPoints: ["真丝材质", "遮光", "礼盒包装", "轻便"],
    competition: "high",
    estimatedProfitRate: 36,
    recommendationIndex: 8,
    keywords: ["眼罩", "sleep mask", "silk", "遮光"],
  },
  {
    id: "c-1005",
    name: "Smart Automatic Pet Feeder 4L Timed Dispenser",
    platform: "AliExpress",
    price: 52.99,
    monthlySales: 540,
    rating: 4.5,
    reviewCount: 318,
    shippingFrom: "Shenzhen, China",
    sellingPoints: ["定时喂食", "4L 大容量", "App 控制", "防潮粮桶"],
    competition: "medium",
    estimatedProfitRate: 26,
    recommendationIndex: 8,
    keywords: ["宠物喂食器", "pet feeder", "automatic feeder", "宠物用品"],
  },
  {
    id: "c-1006",
    name: "Solar Folding Camping Lantern with Power Bank",
    platform: "Amazon",
    price: 24.99,
    monthlySales: 1180,
    rating: 4.6,
    reviewCount: 845,
    shippingFrom: "FBA US Warehouse",
    sellingPoints: ["太阳能充电", "移动电源", "三档调光", "户外防水"],
    competition: "medium",
    estimatedProfitRate: 25,
    recommendationIndex: 8,
    keywords: ["露营灯", "camping lantern", "solar light", "户外"],
  },
  {
    id: "c-1007",
    name: "UPF50+ Ice Silk Cooling Sun Sleeves Pair",
    platform: "Temu",
    price: 3.99,
    monthlySales: 6840,
    rating: 4.6,
    reviewCount: 4521,
    shippingFrom: "Guangzhou, China",
    sellingPoints: ["UPF50+", "冰丝透气", "低价", "多色可选"],
    competition: "high",
    estimatedProfitRate: 16,
    recommendationIndex: 6,
    keywords: ["防晒袖套", "sun sleeves", "uv protection", "冰丝"],
  },
  {
    id: "c-1008",
    name: "Kitchen Peeler Sharpener Set Stainless Steel 4 Pieces",
    platform: "Temu",
    price: 4.49,
    monthlySales: 8650,
    rating: 4.3,
    reviewCount: 5821,
    shippingFrom: "Foshan, China",
    sellingPoints: ["低价套装", "不锈钢", "厨房刚需", "工厂直供"],
    competition: "high",
    estimatedProfitRate: 12,
    recommendationIndex: 5,
    keywords: ["削皮刀", "peeler", "kitchen tools", "厨房用品"],
  },
  {
    id: "c-1009",
    name: "Memory Foam Travel Neck Pillow Foldable U Shape",
    platform: "TikTok Shop",
    price: 12.5,
    monthlySales: 4120,
    rating: 4.8,
    reviewCount: 2715,
    shippingFrom: "Jakarta, Indonesia",
    sellingPoints: ["便携", "记忆棉", "可拆洗", "旅行场景"],
    competition: "high",
    estimatedProfitRate: 29,
    recommendationIndex: 8,
    keywords: ["颈枕", "neck pillow", "travel pillow", "记忆棉"],
  },
  {
    id: "c-1010",
    name: "Baby Food Grinder Bowl 6 Piece Set With Scale",
    platform: "Lazada",
    price: 8.99,
    monthlySales: 1240,
    rating: 4.8,
    reviewCount: 762,
    shippingFrom: "Bangkok, Thailand",
    sellingPoints: ["食品级 PP", "带刻度", "辅食专用", "套装"],
    competition: "low",
    estimatedProfitRate: 31,
    recommendationIndex: 9,
    keywords: ["辅食碗", "baby food", "grinder bowl", "母婴"],
  },
];

export const COMPARE_STORAGE_KEY = "seapick:phase5:compareCompetitors";
export const MAX_COMPARE_COUNT = 5;

export function formatUsd(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

export function formatShortNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function fitLabel(level: FitLevel): string {
  return level === "high" ? "高" : level === "medium" ? "中" : "低";
}

export function riskLabel(level: RiskLevel): string {
  return level === "high" ? "高风险" : level === "medium" ? "中风险" : "低风险";
}

export function competitionLabel(level: CompetitionLevel): string {
  return level === "high" ? "竞争激烈" : level === "medium" ? "竞争中等" : "竞争较低";
}

export function getCompareItems(): CompetitorItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as string[];
    const byId = new Map(COMPETITORS.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter((item): item is CompetitorItem => Boolean(item));
  } catch {
    return [];
  }
}

export function getCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCompareIds(ids: string[]) {
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_COMPARE_COUNT)));
  window.dispatchEvent(new Event("phase5-compare-change"));
}

export function addCompareItem(id: string): { ok: boolean; reason?: "duplicate" | "full" } {
  const ids = getCompareIds();
  if (ids.includes(id)) return { ok: false, reason: "duplicate" };
  if (ids.length >= MAX_COMPARE_COUNT) return { ok: false, reason: "full" };
  saveCompareIds([...ids, id]);
  return { ok: true };
}

export function removeCompareItem(id: string) {
  saveCompareIds(getCompareIds().filter((item) => item !== id));
}

export function clearCompareItems() {
  saveCompareIds([]);
}

export function subscribeCompareItems(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("phase5-compare-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("phase5-compare-change", handler);
    window.removeEventListener("storage", handler);
  };
}
