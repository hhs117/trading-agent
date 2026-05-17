/**
 * SEAPick mock data layer (Phase 2)
 *
 * No real API calls. Everything below is hand-curated to feel like a
 * believable cross-border catalogue and is meant to be reused by
 * downstream pages (analytics, competitors, listing, etc).
 *
 * Read paths used by pages:
 *   - getMockProducts()    → seeds + reads `seapick:mockProducts`
 *   - getMockCompetitors() → seeds + reads `seapick:competitors`
 *   - getMockPlatforms()   → seeds + reads `seapick:platforms`
 */

import { getStorageData, setStorageData } from "@/lib/storage";
import type {
  Copywriting,
  ImageReview,
  Recommendation,
  ScoreDimensions,
} from "@/lib/types";

/* ============================================================
 *  Shared enums / unions
 * ============================================================ */

export type ProductPlatform =
  | "Shopee"
  | "Lazada"
  | "TikTok Shop"
  | "Amazon"
  | "Temu"
  | "AliExpress";

export type ProductStatus = "已上架" | "待上架" | "测试中" | "缺货" | "下架";

export type CompetitionLevel = "low" | "medium" | "high";

export type GrowthTrend = "up" | "down" | "stable";

export type RiskLevel = "low" | "medium" | "high";

export type PlatformFit = "high" | "medium" | "low";

/* ============================================================
 *  Entity shapes (Phase 2)
 *
 *  These are intentionally separate from the legacy `Product` type
 *  in lib/types.ts — that one drives the existing scoring/copywriting
 *  modules and we don't want to disturb it.
 * ============================================================ */

export interface MockProduct {
  id: string;
  storeId?: string;
  name: string;
  category: string;
  platform: ProductPlatform;
  image: string;
  costPrice: number; // CNY
  salePrice: number; // USD (listing currency on the platform)
  shippingCost: number; // CNY, head-haul + tail-haul estimated
  commissionRate: number; // 0-1, platform commission
  monthlySales: number; // units / month
  rating: number; // 0-5
  reviewCount: number;
  supplier: string;
  targetMarket: string[]; // country codes, e.g. ["TH","VN"]
  status: ProductStatus;
  createdAt: string; // ISO timestamp

  // Optional extensions (set as the user enriches the product over time)
  supplierUrl?: string;
  competitorUrl?: string;
  stock?: number;
  notes?: string;
  images?: string[]; // secondary images beyond the primary `image`
  weight?: number; // kg
  updatedAt?: string;
  score?: ScoreDimensions;
  totalScore?: number;
  recommendation?: Recommendation;
  copywritings?: Copywriting[];
  imageReviews?: ImageReview[];
}

export interface Competitor {
  id: string;
  name: string;
  platform: ProductPlatform;
  price: number; // USD
  monthlySales: number;
  rating: number;
  reviewCount: number;
  shippingFrom: string;
  mainSellingPoints: string[];
  competitionLevel: CompetitionLevel;
  estimatedProfitRate: number; // %
  recommendationIndex: number; // 1-10
  /**
   * Optional bilingual search tokens (Chinese + English) used by /search-products.
   * Falls back to `name` when not provided.
   */
  keywords?: string[];
}

export interface PlatformInfo {
  platformName: ProductPlatform;
  hotCategories: string[];
  averagePrice: number; // USD
  competitorCount: number; // active sellers / listings, rough order
  estimatedSales: number; // monthly GMV in USD, rough order
  growthTrend: { direction: GrowthTrend; yoy: number };
  platformFit: PlatformFit;
  riskLevel: RiskLevel;
  suitableProducts: string[];
}

/* ============================================================
 *  localStorage keys
 * ============================================================ */

export const MOCK_STORAGE_KEYS = {
  products: "seapick:mockProducts",
  competitors: "seapick:competitors",
  platforms: "seapick:platforms",
} as const;

/* ============================================================
 *  Mock products — 15 realistic cross-border SKUs
 * ============================================================ */

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "sp-1001",
    name: "304不锈钢真空保温杯 500ml",
    category: "家居生活",
    platform: "Shopee",
    image: "https://picsum.photos/seed/seapick-1001/400/400",
    costPrice: 18.5,
    salePrice: 9.9,
    shippingCost: 6.2,
    commissionRate: 0.08,
    monthlySales: 2840,
    rating: 4.7,
    reviewCount: 1582,
    supplier: "义乌市优品进出口贸易有限公司",
    targetMarket: ["TH", "VN", "ID"],
    status: "已上架",
    createdAt: "2026-03-12T08:24:00.000Z",
    stock: 1840,
    notes: "保温杯在东南亚常年稳态需求，主打 304 食品级与莫兰迪色卖点。",
    score: {
      marketHeat: 8,
      demandGrowth: 7,
      competitionPressure: 6,
      priceCompetition: 7,
      profitFeasibility: 8,
      keywordTraffic: 8,
      competitorMaturity: 7,
      supplyLogistics: 9,
      complianceLocalization: 8,
    },
    totalScore: 7.6,
    recommendation: "recommend",
  },
  {
    id: "sp-1002",
    name: "RGB无线电竞鼠标 2.4G + 蓝牙双模",
    category: "数码电子",
    platform: "Lazada",
    image: "https://picsum.photos/seed/seapick-1002/400/400",
    costPrice: 32.0,
    salePrice: 19.99,
    shippingCost: 8.5,
    commissionRate: 0.06,
    monthlySales: 1620,
    rating: 4.5,
    reviewCount: 894,
    supplier: "深圳市星海跨境电子有限公司",
    targetMarket: ["MY", "PH", "SG"],
    status: "已上架",
    createdAt: "2026-02-20T03:10:00.000Z",
  },
  {
    id: "sp-1003",
    name: "记忆棉折叠人体工学颈枕（U型）",
    category: "家居生活",
    platform: "TikTok Shop",
    image: "https://picsum.photos/seed/seapick-1003/400/400",
    costPrice: 14.8,
    salePrice: 12.5,
    shippingCost: 5.4,
    commissionRate: 0.05,
    monthlySales: 4120,
    rating: 4.8,
    reviewCount: 2715,
    supplier: "杭州市清韵家居用品有限公司",
    targetMarket: ["VN", "ID", "MY"],
    status: "已上架",
    createdAt: "2026-04-02T11:48:00.000Z",
    stock: 920,
    notes: "TikTok 短视频带货爆款，需要重点准备 30 秒种草视频脚本。",
    score: {
      marketHeat: 9,
      demandGrowth: 9,
      competitionPressure: 5,
      priceCompetition: 7,
      profitFeasibility: 8,
      keywordTraffic: 9,
      competitorMaturity: 6,
      supplyLogistics: 8,
      complianceLocalization: 8,
    },
    totalScore: 7.8,
    recommendation: "recommend",
  },
  {
    id: "sp-1004",
    name: "高弹力高腰瑜伽裤 蜜桃臀塑形款",
    category: "服饰配件",
    platform: "Shopee",
    image: "https://picsum.photos/seed/seapick-1004/400/400",
    costPrice: 22.0,
    salePrice: 14.9,
    shippingCost: 4.8,
    commissionRate: 0.08,
    monthlySales: 5380,
    rating: 4.6,
    reviewCount: 3210,
    supplier: "广州市悦风服饰有限公司",
    targetMarket: ["TH", "VN", "PH"],
    status: "已上架",
    createdAt: "2026-01-15T07:30:00.000Z",
    stock: 2150,
    notes: "重点款，注意 SEA 客群偏爱蜜桃臀剪裁与高弹面料。",
    score: {
      marketHeat: 8,
      demandGrowth: 7,
      competitionPressure: 4,
      priceCompetition: 5,
      profitFeasibility: 7,
      keywordTraffic: 8,
      competitorMaturity: 5,
      supplyLogistics: 7,
      complianceLocalization: 9,
    },
    totalScore: 6.7,
    recommendation: "caution",
  },
  {
    id: "sp-1005",
    name: "IP67防水蓝牙音箱 户外便携款",
    category: "数码电子",
    platform: "Amazon",
    image: "https://picsum.photos/seed/seapick-1005/400/400",
    costPrice: 45.0,
    salePrice: 39.99,
    shippingCost: 12.0,
    commissionRate: 0.15,
    monthlySales: 980,
    rating: 4.4,
    reviewCount: 627,
    supplier: "深圳市星海跨境电子有限公司",
    targetMarket: ["US", "UK", "DE"],
    status: "测试中",
    createdAt: "2026-04-18T14:05:00.000Z",
    stock: 380,
    notes: "Amazon FBA 测试中，需复核 CE / FCC 合规以及客单价空间。",
    score: {
      marketHeat: 7,
      demandGrowth: 5,
      competitionPressure: 3,
      priceCompetition: 4,
      profitFeasibility: 6,
      keywordTraffic: 6,
      competitorMaturity: 4,
      supplyLogistics: 6,
      complianceLocalization: 5,
    },
    totalScore: 5.2,
    recommendation: "caution",
  },
  {
    id: "sp-1006",
    name: "多功能不锈钢削皮刀+磨刀器套装（4 件）",
    category: "厨房用品",
    platform: "Temu",
    image: "https://picsum.photos/seed/seapick-1006/400/400",
    costPrice: 6.8,
    salePrice: 4.49,
    shippingCost: 3.2,
    commissionRate: 0.05,
    monthlySales: 8650,
    rating: 4.3,
    reviewCount: 5821,
    supplier: "佛山市厨之友厨电有限公司",
    targetMarket: ["US", "MX", "BR"],
    status: "已上架",
    createdAt: "2026-03-28T05:14:00.000Z",
  },
  {
    id: "sp-1007",
    name: "婴儿辅食研磨碗六件套（带刻度）",
    category: "母婴玩具",
    platform: "Lazada",
    image: "https://picsum.photos/seed/seapick-1007/400/400",
    costPrice: 12.5,
    salePrice: 8.99,
    shippingCost: 4.0,
    commissionRate: 0.07,
    monthlySales: 1240,
    rating: 4.8,
    reviewCount: 762,
    supplier: "厦门市天泽母婴用品有限公司",
    targetMarket: ["TH", "ID", "MY"],
    status: "已上架",
    createdAt: "2026-02-08T09:22:00.000Z",
  },
  {
    id: "sp-1008",
    name: "智能定时宠物自动喂食器 4L 大容量",
    category: "宠物用品",
    platform: "AliExpress",
    image: "https://picsum.photos/seed/seapick-1008/400/400",
    costPrice: 68.0,
    salePrice: 52.99,
    shippingCost: 16.5,
    commissionRate: 0.08,
    monthlySales: 540,
    rating: 4.5,
    reviewCount: 318,
    supplier: "福州市嘉宠宠物用品有限公司",
    targetMarket: ["US", "FR", "DE", "AU"],
    status: "已上架",
    createdAt: "2026-01-30T12:00:00.000Z",
    stock: 280,
    notes: "宠物经济长期增长品类，App 远程喂食功能可作为差异化卖点。",
    score: {
      marketHeat: 7,
      demandGrowth: 8,
      competitionPressure: 6,
      priceCompetition: 7,
      profitFeasibility: 7,
      keywordTraffic: 6,
      competitorMaturity: 6,
      supplyLogistics: 7,
      complianceLocalization: 8,
    },
    totalScore: 7.0,
    recommendation: "recommend",
  },
  {
    id: "sp-1009",
    name: "太阳能折叠露营灯 三档调光+移动电源",
    category: "运动户外",
    platform: "Amazon",
    image: "https://picsum.photos/seed/seapick-1009/400/400",
    costPrice: 28.0,
    salePrice: 24.99,
    shippingCost: 9.5,
    commissionRate: 0.15,
    monthlySales: 1180,
    rating: 4.6,
    reviewCount: 845,
    supplier: "宁波市海邦户外用品有限公司",
    targetMarket: ["US", "AU", "JP"],
    status: "已上架",
    createdAt: "2026-03-05T06:45:00.000Z",
  },
  {
    id: "sp-1010",
    name: "USB便携榨汁杯 一键自动榨汁",
    category: "家居生活",
    platform: "TikTok Shop",
    image: "https://picsum.photos/seed/seapick-1010/400/400",
    costPrice: 16.0,
    salePrice: 13.99,
    shippingCost: 5.5,
    commissionRate: 0.05,
    monthlySales: 3260,
    rating: 4.4,
    reviewCount: 1907,
    supplier: "东莞市恒泰塑胶制品厂",
    targetMarket: ["TH", "VN", "PH"],
    status: "已上架",
    createdAt: "2026-04-10T10:12:00.000Z",
  },
  {
    id: "sp-1011",
    name: "真丝降噪睡眠眼罩（带可调节绑带）",
    category: "美妆个护",
    platform: "Shopee",
    image: "https://picsum.photos/seed/seapick-1011/400/400",
    costPrice: 8.5,
    salePrice: 6.99,
    shippingCost: 2.8,
    commissionRate: 0.08,
    monthlySales: 4720,
    rating: 4.7,
    reviewCount: 2980,
    supplier: "苏州市晨光美妆有限公司",
    targetMarket: ["TH", "SG", "JP"],
    status: "已上架",
    createdAt: "2026-02-25T13:40:00.000Z",
    stock: 4250,
    notes: "高复购、轻物流的睡眠类目，建议绑定情人节 / 母亲节礼盒套装。",
    score: {
      marketHeat: 7,
      demandGrowth: 8,
      competitionPressure: 6,
      priceCompetition: 8,
      profitFeasibility: 9,
      keywordTraffic: 7,
      competitorMaturity: 6,
      supplyLogistics: 9,
      complianceLocalization: 9,
    },
    totalScore: 7.7,
    recommendation: "recommend",
  },
  {
    id: "sp-1012",
    name: "智能数控空气炸锅 4L 大容量低脂",
    category: "家居生活",
    platform: "Lazada",
    image: "https://picsum.photos/seed/seapick-1012/400/400",
    costPrice: 92.0,
    salePrice: 79.99,
    shippingCost: 22.0,
    commissionRate: 0.07,
    monthlySales: 720,
    rating: 4.5,
    reviewCount: 410,
    supplier: "佛山市厨之友厨电有限公司",
    targetMarket: ["MY", "SG", "TH"],
    status: "待上架",
    createdAt: "2026-04-22T08:30:00.000Z",
  },
  {
    id: "sp-1013",
    name: "UPF50+冰丝防晒袖套（情侣两件）",
    category: "服饰配件",
    platform: "Shopee",
    image: "https://picsum.photos/seed/seapick-1013/400/400",
    costPrice: 5.2,
    salePrice: 3.99,
    shippingCost: 2.0,
    commissionRate: 0.08,
    monthlySales: 6840,
    rating: 4.6,
    reviewCount: 4521,
    supplier: "泉州市鸿运纺织有限公司",
    targetMarket: ["TH", "VN", "ID", "PH"],
    status: "已上架",
    createdAt: "2026-03-18T04:55:00.000Z",
  },
  {
    id: "sp-1014",
    name: "北欧风简约陶瓷餐具套装（8 件）",
    category: "家居生活",
    platform: "Temu",
    image: "https://picsum.photos/seed/seapick-1014/400/400",
    costPrice: 35.0,
    salePrice: 22.99,
    shippingCost: 14.0,
    commissionRate: 0.05,
    monthlySales: 410,
    rating: 4.2,
    reviewCount: 197,
    supplier: "潮州市瓷艺餐具有限公司",
    targetMarket: ["US", "UK"],
    status: "缺货",
    createdAt: "2026-02-02T15:18:00.000Z",
    stock: 0,
    notes: "外包装易碎损率偏高，物流方案待优化；当前预计补货 14 天。",
    score: {
      marketHeat: 5,
      demandGrowth: 4,
      competitionPressure: 5,
      priceCompetition: 5,
      profitFeasibility: 5,
      keywordTraffic: 4,
      competitorMaturity: 5,
      supplyLogistics: 3,
      complianceLocalization: 6,
    },
    totalScore: 4.7,
    recommendation: "avoid",
  },
  {
    id: "sp-1015",
    name: "学生党 LED 高颜值折叠化妆镜",
    category: "美妆个护",
    platform: "TikTok Shop",
    image: "https://picsum.photos/seed/seapick-1015/400/400",
    costPrice: 9.8,
    salePrice: 7.99,
    shippingCost: 3.6,
    commissionRate: 0.05,
    monthlySales: 2150,
    rating: 4.5,
    reviewCount: 1284,
    supplier: "苏州市晨光美妆有限公司",
    targetMarket: ["VN", "TH", "ID"],
    status: "测试中",
    createdAt: "2026-04-26T02:08:00.000Z",
  },
];

/* ============================================================
 *  Mock competitors — cross-section of rival listings we benchmark against
 * ============================================================ */

export const MOCK_COMPETITORS: Competitor[] = [
  {
    id: "cp-2001",
    name: "Portable Mini USB Desk Fan, 3 Speed Quiet Rechargeable",
    platform: "Shopee",
    price: 4.59,
    monthlySales: 8120,
    rating: 4.7,
    reviewCount: 4350,
    shippingFrom: "Bangkok, Thailand",
    mainSellingPoints: ["三档静音", "Type-C 快充", "8 小时续航", "桌面/挂脖两用"],
    competitionLevel: "high",
    estimatedProfitRate: 18,
    recommendationIndex: 7,
    keywords: ["mini fan", "usb fan", "迷你风扇", "便携风扇", "桌面风扇"],
  },
  {
    id: "cp-2002",
    name: "Stainless Steel Vacuum Tumbler 500ml BPA-Free",
    platform: "Lazada",
    price: 11.5,
    monthlySales: 2410,
    rating: 4.5,
    reviewCount: 1320,
    shippingFrom: "Yiwu, China",
    mainSellingPoints: ["12 小时保温", "食品级 304 钢", "防漏盖", "莫兰迪配色"],
    competitionLevel: "medium",
    estimatedProfitRate: 27,
    recommendationIndex: 8,
    keywords: ["tumbler", "thermos", "保温杯", "不锈钢杯", "水杯"],
  },
  {
    id: "cp-2003",
    name: "High Waist Tummy Control Yoga Leggings Butt Lift",
    platform: "Shopee",
    price: 12.9,
    monthlySales: 6240,
    rating: 4.6,
    reviewCount: 4108,
    shippingFrom: "Ho Chi Minh, Vietnam",
    mainSellingPoints: ["蜜桃臀剪裁", "高弹四面拉伸", "运动不卷边", "S-XXL 全尺码"],
    competitionLevel: "high",
    estimatedProfitRate: 22,
    recommendationIndex: 6,
    keywords: ["yoga pants", "leggings", "瑜伽裤", "高腰裤", "塑形裤"],
  },
  {
    id: "cp-2004",
    name: "Wireless Gaming Mouse RGB 2.4G Bluetooth Dual Mode",
    platform: "Lazada",
    price: 21.9,
    monthlySales: 1480,
    rating: 4.4,
    reviewCount: 925,
    shippingFrom: "Shenzhen, China",
    mainSellingPoints: ["双模切换", "Type-C 充电", "RGB 自定义", "12000 DPI"],
    competitionLevel: "medium",
    estimatedProfitRate: 24,
    recommendationIndex: 7,
    keywords: ["mouse", "gaming mouse", "wireless mouse", "无线鼠标", "电竞鼠标"],
  },
  {
    id: "cp-2005",
    name: "Memory Foam Travel Neck Pillow Foldable U-Shape",
    platform: "TikTok Shop",
    price: 13.99,
    monthlySales: 5380,
    rating: 4.8,
    reviewCount: 3220,
    shippingFrom: "Jakarta, Indonesia",
    mainSellingPoints: ["可折叠收纳", "记忆棉慢回弹", "可拆洗内胆", "TikTok 爆款"],
    competitionLevel: "high",
    estimatedProfitRate: 19,
    recommendationIndex: 7,
    keywords: ["neck pillow", "travel pillow", "颈枕", "记忆棉枕", "u 型枕"],
  },
  {
    id: "cp-2006",
    name: "Waterproof Bluetooth Speaker IP67 Outdoor Portable",
    platform: "Amazon",
    price: 42.99,
    monthlySales: 1150,
    rating: 4.5,
    reviewCount: 780,
    shippingFrom: "FBA US Warehouse",
    mainSellingPoints: ["IP67 防水", "20W 立体声", "24 小时续航", "TWS 串联"],
    competitionLevel: "high",
    estimatedProfitRate: 28,
    recommendationIndex: 6,
    keywords: ["bluetooth speaker", "waterproof speaker", "蓝牙音箱", "防水音箱", "户外音响"],
  },
  {
    id: "cp-2007",
    name: "4-Piece Kitchen Peeler & Sharpener Set Stainless Steel",
    platform: "Temu",
    price: 5.49,
    monthlySales: 9450,
    rating: 4.2,
    reviewCount: 6280,
    shippingFrom: "Guangzhou, China",
    mainSellingPoints: ["四件套", "防滑硅胶柄", "可拆洗", "工厂直发"],
    competitionLevel: "high",
    estimatedProfitRate: 12,
    recommendationIndex: 5,
    keywords: ["peeler", "kitchen tools", "削皮刀", "厨房套装", "刨刀"],
  },
  {
    id: "cp-2008",
    name: "Baby Food Grinder Bowl 6-Piece Set With Scale",
    platform: "Lazada",
    price: 9.49,
    monthlySales: 1120,
    rating: 4.7,
    reviewCount: 690,
    shippingFrom: "Bangkok, Thailand",
    mainSellingPoints: ["食品级 PP", "带刻度", "可微波", "辅食专用"],
    competitionLevel: "low",
    estimatedProfitRate: 31,
    recommendationIndex: 9,
    keywords: ["baby food", "grinder bowl", "辅食研磨碗", "婴儿辅食", "母婴"],
  },
  {
    id: "cp-2009",
    name: "Smart Automatic Pet Feeder 4L Timed Dispenser",
    platform: "AliExpress",
    price: 56.99,
    monthlySales: 480,
    rating: 4.4,
    reviewCount: 285,
    shippingFrom: "Shenzhen, China",
    mainSellingPoints: ["App 远程控制", "六餐定时", "录音呼叫", "干粮防潮"],
    competitionLevel: "medium",
    estimatedProfitRate: 26,
    recommendationIndex: 8,
    keywords: ["pet feeder", "automatic feeder", "宠物喂食器", "自动喂食", "猫狗用品"],
  },
  {
    id: "cp-2010",
    name: "Solar Folding Camping Lantern with Power Bank",
    platform: "Amazon",
    price: 26.99,
    monthlySales: 920,
    rating: 4.6,
    reviewCount: 612,
    shippingFrom: "FBA US Warehouse",
    mainSellingPoints: ["太阳能充电", "10000mAh 移动电源", "防水", "三档调光"],
    competitionLevel: "medium",
    estimatedProfitRate: 25,
    recommendationIndex: 8,
    keywords: ["camping lantern", "solar light", "露营灯", "太阳能", "户外照明"],
  },
  {
    id: "cp-2011",
    name: "Silk Sleep Eye Mask with Adjustable Strap",
    platform: "Shopee",
    price: 5.99,
    monthlySales: 4180,
    rating: 4.6,
    reviewCount: 2340,
    shippingFrom: "Bangkok, Thailand",
    mainSellingPoints: ["100% 桑蚕丝", "可调节绑带", "遮光率 99%", "便携收纳袋"],
    competitionLevel: "high",
    estimatedProfitRate: 30,
    recommendationIndex: 7,
    keywords: ["eye mask", "sleep mask", "眼罩", "睡眠眼罩", "真丝"],
  },
  {
    id: "cp-2012",
    name: "Smart Digital Air Fryer 4L Low-Fat Cooking",
    platform: "Lazada",
    price: 84.99,
    monthlySales: 640,
    rating: 4.5,
    reviewCount: 380,
    shippingFrom: "Kuala Lumpur, Malaysia",
    mainSellingPoints: ["可视化触屏", "12 种预设菜单", "1500W 速热", "易清洁内胆"],
    competitionLevel: "medium",
    estimatedProfitRate: 23,
    recommendationIndex: 7,
    keywords: ["air fryer", "smart fryer", "空气炸锅", "低脂", "厨房电器"],
  },
  {
    id: "cp-2013",
    name: "UPF50+ Ice Silk Cooling Sun Sleeves (Pair)",
    platform: "Shopee",
    price: 3.49,
    monthlySales: 7820,
    rating: 4.5,
    reviewCount: 5210,
    shippingFrom: "Yiwu, China",
    mainSellingPoints: ["UPF50+ 防晒", "冰丝透气", "防滑硅胶口", "10 色可选"],
    competitionLevel: "high",
    estimatedProfitRate: 16,
    recommendationIndex: 6,
    keywords: ["sun sleeves", "uv protection", "冰丝袖套", "防晒袖", "防晒"],
  },
];

/* ============================================================
 *  Mock platforms — six core marketplaces
 * ============================================================ */

export const MOCK_PLATFORMS: PlatformInfo[] = [
  {
    platformName: "Shopee",
    hotCategories: ["服饰配件", "美妆个护", "家居生活", "母婴玩具", "数码电子"],
    averagePrice: 8.5,
    competitorCount: 1850000,
    estimatedSales: 7800000000,
    growthTrend: { direction: "stable", yoy: 4 },
    platformFit: "high",
    riskLevel: "low",
    suitableProducts: ["低客单价快消", "TikTok 同款", "节日礼品", "本地化日用品"],
  },
  {
    platformName: "Lazada",
    hotCategories: ["数码电子", "家居生活", "美妆个护", "母婴玩具", "运动户外"],
    averagePrice: 14.2,
    competitorCount: 720000,
    estimatedSales: 3200000000,
    growthTrend: { direction: "down", yoy: -6 },
    platformFit: "medium",
    riskLevel: "medium",
    suitableProducts: ["3C 配件", "中等客单价品类", "本地化精品", "新马高端线"],
  },
  {
    platformName: "TikTok Shop",
    hotCategories: ["美妆个护", "服饰配件", "食品饮料", "家居生活", "玩具周边"],
    averagePrice: 11.8,
    competitorCount: 540000,
    estimatedSales: 4100000000,
    growthTrend: { direction: "up", yoy: 38 },
    platformFit: "high",
    riskLevel: "medium",
    suitableProducts: ["短视频爆款", "强视觉冲击品", "网红同款", "情绪价值消费品"],
  },
  {
    platformName: "Amazon",
    hotCategories: ["家居生活", "数码电子", "运动户外", "母婴玩具", "宠物用品"],
    averagePrice: 28.6,
    competitorCount: 2400000,
    estimatedSales: 22000000000,
    growthTrend: { direction: "stable", yoy: 3 },
    platformFit: "medium",
    riskLevel: "high",
    suitableProducts: ["品牌化精品", "FBA 重货", "高客单价工具", "差异化创新品"],
  },
  {
    platformName: "Temu",
    hotCategories: ["家居生活", "服饰配件", "厨房用品", "饰品配件", "玩具周边"],
    averagePrice: 5.9,
    competitorCount: 380000,
    estimatedSales: 5400000000,
    growthTrend: { direction: "up", yoy: 62 },
    platformFit: "high",
    riskLevel: "medium",
    suitableProducts: ["极致低价快消", "工厂直供 SKU", "白牌通货", "高频复购小件"],
  },
  {
    platformName: "AliExpress",
    hotCategories: ["数码电子", "服饰配件", "家居生活", "汽车配件", "工具五金"],
    averagePrice: 12.4,
    competitorCount: 950000,
    estimatedSales: 4800000000,
    growthTrend: { direction: "stable", yoy: 2 },
    platformFit: "medium",
    riskLevel: "low",
    suitableProducts: ["欧洲长尾品", "DIY 配件", "中等利润标品", "俄罗斯/拉美市场"],
  },
];

/* ============================================================
 *  Helpers (localStorage-backed read-through)
 *
 *  Pages should prefer these getters — they will seed defaults
 *  on first call and persist any user edits between sessions.
 * ============================================================ */

export function getMockProducts(): MockProduct[] {
  const data = getStorageData<MockProduct[] | null>(MOCK_STORAGE_KEYS.products, null);
  if (data && data.length > 0) return data;
  setStorageData(MOCK_STORAGE_KEYS.products, MOCK_PRODUCTS);
  return MOCK_PRODUCTS;
}

export function getMockCompetitors(): Competitor[] {
  const data = getStorageData<Competitor[] | null>(MOCK_STORAGE_KEYS.competitors, null);
  if (data && data.length > 0) return data;
  setStorageData(MOCK_STORAGE_KEYS.competitors, MOCK_COMPETITORS);
  return MOCK_COMPETITORS;
}

export function getMockPlatforms(): PlatformInfo[] {
  const data = getStorageData<PlatformInfo[] | null>(MOCK_STORAGE_KEYS.platforms, null);
  if (data && data.length > 0) return data;
  setStorageData(MOCK_STORAGE_KEYS.platforms, MOCK_PLATFORMS);
  return MOCK_PLATFORMS;
}

/** Force-resync localStorage with the in-code mock arrays. */
export function reseedMockData(): void {
  setStorageData(MOCK_STORAGE_KEYS.products, MOCK_PRODUCTS);
  setStorageData(MOCK_STORAGE_KEYS.competitors, MOCK_COMPETITORS);
  setStorageData(MOCK_STORAGE_KEYS.platforms, MOCK_PLATFORMS);
}

/** Seed only if any of the three slots is empty — safe to call on every page mount. */
export function seedMockDataIfEmpty(): void {
  getMockProducts();
  getMockCompetitors();
  getMockPlatforms();
}

/* ============================================================
 *  Mock-product CRUD
 *
 *  These are persisted to the same `seapick:mockProducts` slot
 *  that the read-through getters use, so any page can read +
 *  write without coordinating directly.
 * ============================================================ */

export function generateMockProductId(): string {
  return `sp-u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getMockProductById(id: string): MockProduct | undefined {
  return getMockProducts().find((p) => p.id === id);
}

export function upsertMockProduct(product: MockProduct): void {
  const list = getMockProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  const next = [...list];
  if (idx >= 0) next[idx] = product;
  else next.unshift(product);
  setStorageData(MOCK_STORAGE_KEYS.products, next);
}

export function deleteMockProduct(id: string): void {
  const next = getMockProducts().filter((p) => p.id !== id);
  setStorageData(MOCK_STORAGE_KEYS.products, next);
}

/* ============================================================
 *  Dropdown / labelling constants used by forms & filters
 * ============================================================ */

export const MOCK_PLATFORM_OPTIONS: ProductPlatform[] = [
  "Shopee",
  "Lazada",
  "TikTok Shop",
  "Amazon",
  "Temu",
  "AliExpress",
];

export const MOCK_STATUS_OPTIONS: ProductStatus[] = [
  "待上架",
  "测试中",
  "已上架",
  "缺货",
  "下架",
];

export const MOCK_CATEGORIES = [
  "数码电子",
  "服饰配件",
  "家居生活",
  "厨房用品",
  "母婴玩具",
  "美妆个护",
  "运动户外",
  "宠物用品",
  "食品饮料",
  "其他",
] as const;

export interface MarketOption {
  code: string;
  label: string;
  region: "SEA" | "Global";
}

export const MOCK_MARKET_OPTIONS: MarketOption[] = [
  { code: "TH", label: "泰国", region: "SEA" },
  { code: "VN", label: "越南", region: "SEA" },
  { code: "ID", label: "印尼", region: "SEA" },
  { code: "MY", label: "马来西亚", region: "SEA" },
  { code: "PH", label: "菲律宾", region: "SEA" },
  { code: "SG", label: "新加坡", region: "SEA" },
  { code: "US", label: "美国", region: "Global" },
  { code: "UK", label: "英国", region: "Global" },
  { code: "DE", label: "德国", region: "Global" },
  { code: "FR", label: "法国", region: "Global" },
  { code: "JP", label: "日本", region: "Global" },
  { code: "AU", label: "澳大利亚", region: "Global" },
  { code: "MX", label: "墨西哥", region: "Global" },
  { code: "BR", label: "巴西", region: "Global" },
  { code: "AE", label: "阿联酋", region: "Global" },
];

export const MOCK_MARKET_LABELS: Record<string, string> = MOCK_MARKET_OPTIONS.reduce(
  (acc, m) => {
    acc[m.code] = m.label;
    return acc;
  },
  {} as Record<string, string>
);

export const STATUS_TONE: Record<
  ProductStatus,
  "blue" | "green" | "orange" | "red" | "gray"
> = {
  待上架: "blue",
  测试中: "orange",
  已上架: "green",
  缺货: "red",
  下架: "gray",
};
