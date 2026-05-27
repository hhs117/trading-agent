import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  createListingPublishJobInDb,
  isDatabaseConfigured,
  writeAuditLogToDb,
} from "@/lib/server/database";
import {
  getTikTokShopIntegrationStatus,
  validateTikTokShopListingDraft,
  type TikTokShopListingDraft,
} from "@/lib/server/tiktok-shop";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin", "operator"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    draft?: TikTokShopListingDraft;
    dryRun?: boolean;
    storeId?: string | null;
    productId?: string | null;
  };
  if (!body.draft) {
    return NextResponse.json({ ok: false, message: "Missing listing draft" }, { status: 400 });
  }

  const issues = validateTikTokShopListingDraft(body.draft);
  const hasError = issues.some((issue) => issue.severity === "error");
  if (hasError) {
    return NextResponse.json({ ok: false, message: "Draft is not publishable", issues }, { status: 400 });
  }

  const status = getTikTokShopIntegrationStatus();
  if (!status.configured || body.dryRun !== false) {
    const preview = {
      externalProductId: `tiktok-draft-${Date.now()}`,
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
      message: "TikTok Shop live publishing is not connected yet. This request passed local validation only.",
      tiktokShop: status,
      issues,
      preview,
      job,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      message: "Live TikTok Shop publish is reserved for the token exchange and product API implementation step.",
      tiktokShop: status,
    },
    { status: 501 }
  );
}

async function savePublishJob(input: {
  userId: string;
  storeId: string | null;
  productId: string | null;
  draft: Record<string, unknown>;
  issues: unknown[];
  status: "dry_run" | "validated";
  externalProductId?: string | null;
}) {
  if (!isDatabaseConfigured()) return undefined;
  const job = await createListingPublishJobInDb({
    storeId: input.storeId,
    productId: input.productId,
    platform: "TikTok Shop",
    status: input.status,
    draft: input.draft,
    validationIssues: input.issues,
    externalProductId: input.externalProductId ?? null,
    createdBy: input.userId,
  });
  await writeAuditLogToDb({
    userId: input.userId,
    action: "tiktok_shop.publish_dry_run",
    entityType: "listing_publish_job",
    entityId: job.id,
    metadata: { storeId: job.storeId, productId: job.productId },
  });
  return job;
}
