import type { CompetitorItem, PlatformName } from "@/data/phase5";
import type { MockProduct } from "@/data/mockData";

export type SearchProductsProvider =
  | "unconfigured"
  | "auto"
  | "mock"
  | "external"
  | "rainforest"
  | "zhixia"
  | "fastmoss"
  | "apify";

export type SearchProductsResponse = {
  ok: boolean;
  items: CompetitorItem[];
  provider: SearchProductsProvider;
  providers: SearchProductsProvider[];
  requestedProvider: SearchProductsProvider;
  fallbackUsed: boolean;
  warning?: string;
  warnings?: string[];
};

type PromoteSearchProductResponse = {
  ok: boolean;
  database?: boolean;
  product?: MockProduct;
  message?: string;
};

export async function searchApiProducts(input: {
  keyword: string;
  platform?: PlatformName | "";
  limit?: number;
}): Promise<SearchProductsResponse> {
  const params = new URLSearchParams({
    keyword: input.keyword,
    limit: String(input.limit ?? 30),
  });
  if (input.platform) params.set("platform", input.platform);

  const response = await fetch(`/api/search-products?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Search request failed with ${response.status}`);
  }
  return (await response.json()) as SearchProductsResponse;
}

export async function promoteSearchProduct(item: CompetitorItem): Promise<MockProduct | undefined> {
  const response = await fetch("/api/search-products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item }),
  });
  if (!response.ok) return undefined;
  const body = (await response.json()) as PromoteSearchProductResponse;
  return body.product;
}
