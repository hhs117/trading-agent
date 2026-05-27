import type { ShopeeListingDraft, ShopeeListingValidationIssue } from "@/lib/server/shopee";

type ValidateShopeeListingResponse = {
  ok: boolean;
  draft?: ShopeeListingDraft;
  valid?: boolean;
  issues?: ShopeeListingValidationIssue[];
  message?: string;
};

type PublishShopeeListingResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  issues?: ShopeeListingValidationIssue[];
  preview?: {
    externalProductId: string;
    title: string;
    price: number;
    currency: string;
    stock: number;
  };
};

export async function validateShopeeProductDraft(input: {
  productId: string;
  storeId?: string;
}): Promise<ValidateShopeeListingResponse> {
  const response = await fetch("/api/shopee/validate-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as ValidateShopeeListingResponse;
}

export async function dryRunShopeePublish(
  draft: ShopeeListingDraft
): Promise<PublishShopeeListingResponse> {
  const response = await fetch("/api/shopee/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, dryRun: true }),
  });
  return (await response.json()) as PublishShopeeListingResponse;
}
