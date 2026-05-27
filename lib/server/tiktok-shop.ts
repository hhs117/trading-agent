import type { MockProduct } from "@/data/mockData";
import type { StoreRecord } from "@/lib/server/database";

export type TikTokShopRegion = "US" | "GB" | "TH" | "MY" | "PH" | "SG" | "VN" | "ID";

export type TikTokShopIntegrationStatus = {
  configured: boolean;
  mode: "mock" | "live";
  missingEnv: string[];
  appKey: string | null;
  apiBaseUrl: string;
  authUrl: string | null;
};

export type TikTokShopListingDraft = {
  productId?: string;
  storeId?: string;
  region: TikTokShopRegion;
  title: string;
  description: string;
  categoryId?: string | null;
  brandId?: string | null;
  price: number;
  currency: string;
  stock: number;
  warehouseId?: string | null;
  packageWeightKg?: number | null;
  packageDimensionsCm?: { length: number; width: number; height: number } | null;
  images: string[];
  attributes: Array<{ id?: string; name: string; value: string }>;
  skus: Array<{
    sellerSku: string;
    price: number;
    stock: number;
    optionName?: string;
  }>;
  sourceUrl?: string | null;
};

export type TikTokShopListingValidationIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

const DEFAULT_API_BASE_URL = "https://open-api.tiktokglobalshop.com";
const DEFAULT_AUTH_BASE_URL = "https://services.tiktokshop.com/open/authorize";

const REGION_CURRENCIES: Record<TikTokShopRegion, string> = {
  US: "USD",
  GB: "GBP",
  TH: "THB",
  MY: "MYR",
  PH: "PHP",
  SG: "SGD",
  VN: "VND",
  ID: "IDR",
};

export function getTikTokShopIntegrationStatus(): TikTokShopIntegrationStatus {
  const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim() || "";
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET?.trim() || "";
  const redirectUrl = process.env.TIKTOK_SHOP_REDIRECT_URL?.trim() || "";
  const missingEnv = [
    ["TIKTOK_SHOP_APP_KEY", appKey],
    ["TIKTOK_SHOP_APP_SECRET", appSecret],
    ["TIKTOK_SHOP_REDIRECT_URL", redirectUrl],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    configured: missingEnv.length === 0,
    mode: missingEnv.length === 0 ? "live" : "mock",
    missingEnv,
    appKey: appKey || null,
    apiBaseUrl: process.env.TIKTOK_SHOP_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
    authUrl: process.env.TIKTOK_SHOP_AUTH_BASE_URL?.trim() || DEFAULT_AUTH_BASE_URL,
  };
}

export function buildTikTokShopAuthUrl(state: string) {
  const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
  const redirectUrl = process.env.TIKTOK_SHOP_REDIRECT_URL?.trim();
  if (!appKey || !redirectUrl) {
    throw new Error("TikTok Shop auth env is not configured");
  }

  const baseUrl = process.env.TIKTOK_SHOP_AUTH_BASE_URL?.trim() || DEFAULT_AUTH_BASE_URL;
  const url = new URL(baseUrl);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("state", state);
  return url.toString();
}

export function mapProductToTikTokShopDraft(input: {
  product: MockProduct;
  store?: StoreRecord | null;
  region?: TikTokShopRegion;
}): TikTokShopListingDraft {
  const region = input.region ?? inferRegion(input.store?.market) ?? "US";
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
    title: input.product.name.slice(0, 255),
    description: descriptionParts.join("\n\n") || input.product.name,
    categoryId: null,
    brandId: null,
    price: input.product.salePrice,
    currency,
    stock: input.product.stock ?? 0,
    warehouseId: null,
    packageWeightKg: input.product.weight ?? null,
    packageDimensionsCm: null,
    images,
    attributes: [],
    skus: [
      {
        sellerSku: input.product.id,
        price: input.product.salePrice,
        stock: input.product.stock ?? 0,
      },
    ],
    sourceUrl: input.product.supplierUrl ?? null,
  };
}

export function validateTikTokShopListingDraft(
  draft: TikTokShopListingDraft
): TikTokShopListingValidationIssue[] {
  const issues: TikTokShopListingValidationIssue[] = [];

  if (!draft.title.trim()) addError("title", "Missing product title");
  if (draft.title.length > 255) addError("title", "Title must be 255 characters or less");
  if (!draft.description.trim()) addError("description", "Missing product description");
  if (!draft.categoryId) addError("categoryId", "TikTok Shop category is required before live publishing");
  if (!draft.price || draft.price <= 0) addError("price", "Price must be greater than 0");
  if (!Number.isInteger(draft.stock) || draft.stock < 0) addError("stock", "Stock must be a non-negative integer");
  if (!draft.warehouseId) addError("warehouseId", "Warehouse is required for live publishing");
  if (!draft.packageWeightKg || draft.packageWeightKg <= 0) {
    addWarning("packageWeightKg", "Package weight is recommended before publishing");
  }
  if (!draft.packageDimensionsCm) {
    addWarning("packageDimensionsCm", "Package dimensions are recommended for logistics");
  }
  if (draft.images.length === 0) addError("images", "At least one product image is required");
  if (draft.attributes.length === 0) addWarning("attributes", "Category attributes are not filled yet");

  return issues;

  function addError(field: string, message: string) {
    issues.push({ field, severity: "error", message });
  }

  function addWarning(field: string, message: string) {
    issues.push({ field, severity: "warning", message });
  }
}

function inferRegion(market?: string | null): TikTokShopRegion | null {
  if (!market) return null;
  const upper = market.toUpperCase();
  if (upper === "UK") return "GB";
  if (upper in REGION_CURRENCIES) return upper as TikTokShopRegion;
  if (market.includes("泰")) return "TH";
  if (market.includes("马")) return "MY";
  if (market.includes("新")) return "SG";
  if (market.includes("印尼")) return "ID";
  if (market.includes("越")) return "VN";
  if (market.includes("菲")) return "PH";
  if (market.includes("英")) return "GB";
  if (market.includes("美")) return "US";
  return null;
}
