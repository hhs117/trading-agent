import { createHmac } from "crypto";

import type { MockProduct } from "@/data/mockData";
import type { StoreRecord } from "@/lib/server/database";

export type ShopeeRegion =
  | "SG"
  | "MY"
  | "TH"
  | "TW"
  | "ID"
  | "VN"
  | "PH"
  | "BR"
  | "MX"
  | "CO"
  | "CL";

export type ShopeeIntegrationStatus = {
  configured: boolean;
  mode: "mock" | "live";
  missingEnv: string[];
  partnerId: string | null;
  apiBaseUrl: string;
};

export type ShopeeListingDraft = {
  productId?: string;
  storeId?: string;
  region: ShopeeRegion;
  title: string;
  description: string;
  categoryId?: number | null;
  brand?: string | null;
  price: number;
  currency: string;
  stock: number;
  weightKg?: number | null;
  images: string[];
  attributes: Array<{ id?: number; name: string; value: string }>;
  logistics: Array<{ id?: number; name: string; enabled: boolean }>;
  variationSkus: Array<{
    sku: string;
    price: number;
    stock: number;
    optionName?: string;
  }>;
  sourceUrl?: string | null;
};

export type ShopeeListingValidationIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

const DEFAULT_API_BASE_URL = "https://partner.shopeemobile.com";
const DEFAULT_AUTH_BASE_URL = "https://partner.shopeemobile.com";

const REGION_CURRENCIES: Record<ShopeeRegion, string> = {
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  TW: "TWD",
  ID: "IDR",
  VN: "VND",
  PH: "PHP",
  BR: "BRL",
  MX: "MXN",
  CO: "COP",
  CL: "CLP",
};

export function getShopeeIntegrationStatus(): ShopeeIntegrationStatus {
  const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || process.env.SHOPEE_CLIENT_ID?.trim() || "";
  const partnerKey =
    process.env.SHOPEE_PARTNER_KEY?.trim() || process.env.SHOPEE_CLIENT_SECRET?.trim() || "";
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL?.trim() || "";
  const missingEnv = [
    ["SHOPEE_PARTNER_ID", partnerId],
    ["SHOPEE_PARTNER_KEY", partnerKey],
    ["SHOPEE_REDIRECT_URL", redirectUrl],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    configured: missingEnv.length === 0,
    mode: missingEnv.length === 0 ? "live" : "mock",
    missingEnv,
    partnerId: partnerId || null,
    apiBaseUrl: process.env.SHOPEE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  };
}

export function signShopeePath(path: string, timestamp: number, extraBase = "") {
  const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || process.env.SHOPEE_CLIENT_ID?.trim();
  const partnerKey =
    process.env.SHOPEE_PARTNER_KEY?.trim() || process.env.SHOPEE_CLIENT_SECRET?.trim();
  if (!partnerId || !partnerKey) {
    throw new Error("Shopee partner credentials are not configured");
  }

  return createHmac("sha256", partnerKey)
    .update(`${partnerId}${path}${timestamp}${extraBase}`)
    .digest("hex");
}

export function buildShopeeAuthUrl(state: string) {
  const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || process.env.SHOPEE_CLIENT_ID?.trim();
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL?.trim();
  if (!partnerId || !redirectUrl) {
    throw new Error("Shopee auth env is not configured");
  }

  const path = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = signShopeePath(path, timestamp);
  const baseUrl = process.env.SHOPEE_AUTH_BASE_URL?.trim() || DEFAULT_AUTH_BASE_URL;
  const url = new URL(path, baseUrl);
  url.searchParams.set("partner_id", partnerId);
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("redirect", redirectUrl);
  url.searchParams.set("state", state);
  return url.toString();
}

export function mapProductToShopeeDraft(input: {
  product: MockProduct;
  store?: StoreRecord | null;
  region?: ShopeeRegion;
}): ShopeeListingDraft {
  const region = input.region ?? inferRegion(input.store?.market) ?? "TH";
  const currency = input.store?.currency || REGION_CURRENCIES[region];
  const images = [input.product.image, ...(input.product.images ?? [])].filter(Boolean);
  const descriptionParts = [
    input.product.notes,
    input.product.supplier ? `Supplier: ${input.product.supplier}` : "",
    input.product.supplierUrl ? `Source: ${input.product.supplierUrl}` : "",
  ].filter(Boolean);

  return {
    productId: input.product.id,
    storeId: input.store?.id,
    region,
    title: input.product.name.slice(0, 120),
    description: descriptionParts.join("\n\n") || input.product.name,
    categoryId: null,
    brand: null,
    price: input.product.salePrice,
    currency,
    stock: input.product.stock ?? 0,
    weightKg: input.product.weight ?? null,
    images,
    attributes: [],
    logistics: [],
    variationSkus: [
      {
        sku: input.product.id,
        price: input.product.salePrice,
        stock: input.product.stock ?? 0,
      },
    ],
    sourceUrl: input.product.supplierUrl ?? null,
  };
}

export function validateShopeeListingDraft(draft: ShopeeListingDraft): ShopeeListingValidationIssue[] {
  const issues: ShopeeListingValidationIssue[] = [];

  if (!draft.title.trim()) addError("title", "Missing product title");
  if (draft.title.length > 120) addError("title", "Title must be 120 characters or less");
  if (!draft.description.trim()) addError("description", "Missing product description");
  if (!draft.categoryId) addError("categoryId", "Shopee category is required before live publishing");
  if (!draft.price || draft.price <= 0) addError("price", "Price must be greater than 0");
  if (!Number.isInteger(draft.stock) || draft.stock < 0) addError("stock", "Stock must be a non-negative integer");
  if (!draft.weightKg || draft.weightKg <= 0) addWarning("weightKg", "Weight is recommended for logistics quotes");
  if (draft.images.length === 0) addError("images", "At least one product image is required");
  if (draft.images.length > 9) addWarning("images", "Shopee usually supports up to 9 item images");
  if (draft.attributes.length === 0) {
    addWarning("attributes", "Category attributes are not filled yet");
  }
  if (draft.logistics.length === 0) {
    addWarning("logistics", "Logistics channel is not selected yet");
  }

  return issues;

  function addError(field: string, message: string) {
    issues.push({ field, severity: "error", message });
  }

  function addWarning(field: string, message: string) {
    issues.push({ field, severity: "warning", message });
  }
}

function inferRegion(market?: string | null): ShopeeRegion | null {
  if (!market) return null;
  const upper = market.toUpperCase();
  if (upper in REGION_CURRENCIES) return upper as ShopeeRegion;
  if (market.includes("泰")) return "TH";
  if (market.includes("马")) return "MY";
  if (market.includes("新")) return "SG";
  if (market.includes("印尼")) return "ID";
  if (market.includes("越")) return "VN";
  if (market.includes("菲")) return "PH";
  return null;
}
