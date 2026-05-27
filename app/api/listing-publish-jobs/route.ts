import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";
import {
  createListingPublishJobInDb,
  isDatabaseConfigured,
  listListingPublishJobsFromDb,
  updateListingPublishJobInDb,
  writeAuditLogToDb,
  type ListingPublishStatus,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = new Set<ListingPublishStatus>([
  "draft",
  "validated",
  "dry_run",
  "publishing",
  "published",
  "failed",
]);

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

async function requireOperator() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin", "operator"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId") || undefined;
    const platform = url.searchParams.get("platform") || undefined;
    const limit = Number(url.searchParams.get("limit") || "100");
    const jobs = await listListingPublishJobsFromDb({ storeId, platform, limit });
    return NextResponse.json({ ok: true, database: true, jobs });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireOperator();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as {
      storeId?: string | null;
      productId?: string | null;
      platform?: string;
      status?: ListingPublishStatus;
      draft?: Record<string, unknown>;
      validationIssues?: unknown[];
      externalProductId?: string | null;
      errorMessage?: string | null;
    };

    const platform = body.platform?.trim();
    const status = body.status ?? "draft";
    if (!platform || !body.draft || !STATUSES.has(status)) {
      return NextResponse.json({ ok: false, message: "Invalid publish job payload" }, { status: 400 });
    }

    const job = await createListingPublishJobInDb({
      storeId: body.storeId ?? null,
      productId: body.productId ?? null,
      platform,
      status,
      draft: body.draft,
      validationIssues: body.validationIssues ?? [],
      externalProductId: body.externalProductId ?? null,
      errorMessage: body.errorMessage ?? null,
      createdBy: auth.id,
    });
    await writeAuditLogToDb({
      userId: auth.id,
      action: "listing_publish_job.created",
      entityType: "listing_publish_job",
      entityId: job.id,
      metadata: { platform: job.platform, status: job.status, storeId: job.storeId },
    });
    return NextResponse.json({ ok: true, database: true, job }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOperator();
  if (isAuthResponse(auth)) return auth;
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as {
      id?: string;
      storeId?: string | null;
      productId?: string | null;
      platform?: string;
      status?: ListingPublishStatus;
      draft?: Record<string, unknown>;
      validationIssues?: unknown[];
      externalProductId?: string | null;
      errorMessage?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ ok: false, message: "Missing publish job id" }, { status: 400 });
    }
    if (body.status && !STATUSES.has(body.status)) {
      return NextResponse.json({ ok: false, message: "Invalid publish job status" }, { status: 400 });
    }

    const job = await updateListingPublishJobInDb(body.id, {
      storeId: "storeId" in body ? body.storeId ?? null : undefined,
      productId: "productId" in body ? body.productId ?? null : undefined,
      platform: body.platform?.trim(),
      status: body.status,
      draft: body.draft,
      validationIssues: body.validationIssues,
      externalProductId: "externalProductId" in body ? body.externalProductId ?? null : undefined,
      errorMessage: "errorMessage" in body ? body.errorMessage ?? null : undefined,
    });
    if (!job) {
      return NextResponse.json({ ok: false, message: "Publish job not found" }, { status: 404 });
    }

    await writeAuditLogToDb({
      userId: auth.id,
      action: "listing_publish_job.updated",
      entityType: "listing_publish_job",
      entityId: job.id,
      metadata: { platform: job.platform, status: job.status, storeId: job.storeId },
    });
    return NextResponse.json({ ok: true, database: true, job });
  } catch (error) {
    return errorResponse(error);
  }
}
