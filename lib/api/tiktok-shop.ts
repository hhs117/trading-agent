import type {
  TikTokShopListingDraft,
  TikTokShopListingValidationIssue,
} from "@/lib/server/tiktok-shop";

type ValidateTikTokShopListingResponse = {
  ok: boolean;
  draft?: TikTokShopListingDraft;
  valid?: boolean;
  issues?: TikTokShopListingValidationIssue[];
  message?: string;
};

type PublishTikTokShopListingResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  issues?: TikTokShopListingValidationIssue[];
  preview?: {
    externalProductId: string;
    title: string;
    price: number;
    currency: string;
    stock: number;
  };
};

export async function validateTikTokShopProductDraft(input: {
  productId: string;
  storeId?: string;
}): Promise<ValidateTikTokShopListingResponse> {
  const response = await fetch("/api/tiktok-shop/validate-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as ValidateTikTokShopListingResponse;
}

export async function dryRunTikTokShopPublish(
  draft: TikTokShopListingDraft
): Promise<PublishTikTokShopListingResponse> {
  const response = await fetch("/api/tiktok-shop/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, dryRun: true }),
  });
  return (await response.json()) as PublishTikTokShopListingResponse;
}
