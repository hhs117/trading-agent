import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import { decryptSecret, encryptSecret, isTokenEncryptionConfigured } from "@/lib/server/crypto";
import {
  createListingPublishJobInDb,
  getStoreAuthTokenFromDb,
  isDatabaseConfigured,
  updateListingPublishJobInDb,
  upsertStoreAuthTokenInDb,
  writeAuditLogToDb,
  type ListingPublishStatus,
  type StoreAuthTokenRecord,
} from "@/lib/server/database";
import {
  addShopeeItem,
  getShopeeIntegrationStatus,
  refreshShopeeAccessToken,
  validateShopeeListingDraft,
  type ShopeeListingDraft,
} from "@/lib/server/shopee";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin", "operator"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    draft?: ShopeeListingDraft;
    dryRun?: boolean;
    storeId?: string | null;
    productId?: string | null;
    shopId?: string | null;
  };
  if (!body.draft) {
    return NextResponse.json({ ok: false, message: "Missing listing draft" }, { status: 400 });
  }

  const issues = validateShopeeListingDraft(body.draft);
  const hasError = issues.some((issue) => issue.severity === "error");
  if (hasError) {
    return NextResponse.json({ ok: false, message: "Draft is not publishable", issues }, { status: 400 });
  }

  const status = getShopeeIntegrationStatus();
  if (!status.configured || body.dryRun !== false) {
    const preview = {
      externalProductId: `draft-${Date.now()}`,
      title: body.draft.title,
      price: body.draft.price,
      currency: body.draft.currency,
      stock: body.draft.stock,
    };
    const job = await savePublishJob({
      userId: auth.id,
      storeId: body.storeId ?? null,
      productId: body.productId ?? null,
      draft: body.draft as unknown as Record<string, unknown>,
      issues,
      status: "dry_run",
      externalProductId: preview.externalProductId,
    });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      message: status.configured
        ? "Dry run only. Set dryRun=false to publish live."
        : "Shopee is not connected yet. This request passed local validation only.",
      shopee: status,
      issues,
      preview,
      job,
    });
  }

  if (!isTokenEncryptionConfigured()) {
    return NextResponse.json(
      { ok: false, message: "TOKEN_ENCRYPTION_KEY is not configured" },
      { status: 500 }
    );
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL is not configured" },
      { status: 500 }
    );
  }

  const token = await getStoreAuthTokenFromDb({
    platform: "Shopee",
    storeId: body.storeId ?? null,
    externalShopId: body.shopId ?? null,
  });
  if (!token || !token.externalShopId || !token.accessTokenEncrypted) {
    return NextResponse.json(
      { ok: false, message: "Shop is not authorized yet. Run the OAuth flow first." },
      { status: 409 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await ensureFreshAccessToken(token);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to refresh Shopee access token",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }

  const job = await savePublishJob({
    userId: auth.id,
    storeId: body.storeId ?? token.storeId ?? null,
    productId: body.productId ?? null,
    draft: body.draft as unknown as Record<string, unknown>,
    issues,
    status: "publishing",
  });

  try {
    const result = await addShopeeItem({
      accessToken,
      shopId: token.externalShopId,
      draft: body.draft,
    });

    if (job) {
      await updateListingPublishJobInDb(job.id, {
        status: "published",
        externalProductId: String(result.item_id),
      });
    }
    await writeAuditLogToDb({
      userId: auth.id,
      action: "shopee.publish_live",
      entityType: "listing_publish_job",
      entityId: job?.id ?? null,
      metadata: { shopId: token.externalShopId, itemId: result.item_id, requestId: result.request_id },
    });

    return NextResponse.json({
      ok: true,
      dryRun: false,
      itemId: result.item_id,
      requestId: result.request_id,
      job: job ? { ...job, status: "published", externalProductId: String(result.item_id) } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (job) {
      await updateListingPublishJobInDb(job.id, {
        status: "failed",
        errorMessage: message,
      });
    }
    await writeAuditLogToDb({
      userId: auth.id,
      action: "shopee.publish_failed",
      entityType: "listing_publish_job",
      entityId: job?.id ?? null,
      metadata: { shopId: token.externalShopId, error: message },
    });
    return NextResponse.json(
      { ok: false, message: "Shopee add_item failed", error: message, job },
      { status: 502 }
    );
  }
}

async function ensureFreshAccessToken(token: StoreAuthTokenRecord): Promise<string> {
  if (!token.accessTokenEncrypted) {
    throw new Error("Stored access token is missing");
  }
  const expiresAt = token.accessTokenExpiresAt ? new Date(token.accessTokenExpiresAt).getTime() : 0;
  const shouldRefresh = !expiresAt || expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  if (!shouldRefresh) {
    return decryptSecret(token.accessTokenEncrypted);
  }

  if (!token.refreshTokenEncrypted || !token.externalShopId) {
    throw new Error("Missing refresh token; re-run the OAuth flow");
  }
  const refreshToken = decryptSecret(token.refreshTokenEncrypted);
  const refreshed = await refreshShopeeAccessToken({
    refreshToken,
    shopId: token.externalShopId,
  });
  const now = Date.now();
  await upsertStoreAuthTokenInDb({
    storeId: token.storeId,
    platform: "Shopee",
    externalShopId: token.externalShopId,
    accessTokenEncrypted: encryptSecret(refreshed.access_token),
    refreshTokenEncrypted: encryptSecret(refreshed.refresh_token),
    accessTokenExpiresAt: new Date(now + (refreshed.expire_in ?? 0) * 1000).toISOString(),
    refreshTokenExpiresAt: refreshed.refresh_token_expire_in
      ? new Date(now + refreshed.refresh_token_expire_in * 1000).toISOString()
      : token.refreshTokenExpiresAt,
    scopes: token.scopes,
    raw: { ...token.raw, refreshed_at: new Date().toISOString() },
  });
  return refreshed.access_token;
}

async function savePublishJob(input: {
  userId: string;
  storeId: string | null;
  productId: string | null;
  draft: Record<string, unknown>;
  issues: unknown[];
  status: ListingPublishStatus;
  externalProductId?: string | null;
}) {
  if (!isDatabaseConfigured()) return undefined;
  const job = await createListingPublishJobInDb({
    storeId: input.storeId,
    productId: input.productId,
    platform: "Shopee",
    status: input.status,
    draft: input.draft,
    validationIssues: input.issues,
    externalProductId: input.externalProductId ?? null,
    createdBy: input.userId,
  });
  await writeAuditLogToDb({
    userId: input.userId,
    action:
      input.status === "dry_run" ? "shopee.publish_dry_run" : "shopee.publish_started",
    entityType: "listing_publish_job",
    entityId: job.id,
    metadata: { storeId: job.storeId, productId: job.productId },
  });
  return job;
}
