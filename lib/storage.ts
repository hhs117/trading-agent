import type { Product } from "./types";

const KEY = "seapick_products";

export function getProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(products));
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function upsertProduct(product: Product): void {
  const list = getProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.unshift(product);
  saveProducts(list);
}

export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter((p) => p.id !== id));
}

export function generateId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function seedIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (getProducts().length > 0) return;

  const now = new Date().toISOString();
  const samples: Product[] = [
    {
      id: generateId(),
      name: "便携式迷你USB风扇",
      platform: "TikTok Shop",
      targetCountries: ["TH", "VN", "ID"],
      category: "数码电子",
      costPrice: 8,
      sellPrice: 29.9,
      weight: 0.18,
      supplierUrl: "https://1688.com/example1",
      competitorUrl: "https://shopee.co.th/example1",
      imageUrls: [],
      notes: "夏季旺季，TikTok 短视频带货效果好",
      createdAt: now,
      updatedAt: now,
      score: {
        marketHeat: 9,
        demandGrowth: 9,
        competitionPressure: 6,
        priceCompetition: 7,
        profitFeasibility: 8,
        keywordTraffic: 8,
        competitorMaturity: 6,
        supplyLogistics: 9,
        complianceLocalization: 8,
      },
      totalScore: 7.7,
      recommendation: "recommend",
    },
    {
      id: generateId(),
      name: "高弹力瑜伽裤",
      platform: "Shopee",
      targetCountries: ["VN", "MY"],
      category: "服饰配件",
      costPrice: 18,
      sellPrice: 79,
      weight: 0.3,
      supplierUrl: "https://1688.com/example2",
      competitorUrl: "https://shopee.vn/example2",
      imageUrls: [],
      notes: "尺码问题需要特别注意",
      createdAt: now,
      updatedAt: now,
      score: {
        marketHeat: 7,
        demandGrowth: 6,
        competitionPressure: 4,
        priceCompetition: 5,
        profitFeasibility: 7,
        keywordTraffic: 6,
        competitorMaturity: 5,
        supplyLogistics: 7,
        complianceLocalization: 8,
      },
      totalScore: 6.2,
      recommendation: "caution",
    },
    {
      id: generateId(),
      name: "智能电子血压计",
      platform: "Lazada",
      targetCountries: ["SG", "MY"],
      category: "家居生活",
      costPrice: 65,
      sellPrice: 159,
      weight: 0.5,
      supplierUrl: "",
      competitorUrl: "",
      imageUrls: [],
      notes: "需要医疗器械认证，门槛高",
      createdAt: now,
      updatedAt: now,
      score: {
        marketHeat: 5,
        demandGrowth: 4,
        competitionPressure: 4,
        priceCompetition: 5,
        profitFeasibility: 6,
        keywordTraffic: 4,
        competitorMaturity: 5,
        supplyLogistics: 4,
        complianceLocalization: 2,
      },
      totalScore: 4.3,
      recommendation: "avoid",
    },
  ];
  saveProducts(samples);
}
