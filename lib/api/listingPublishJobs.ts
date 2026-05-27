import type { ListingPublishJobRecord, ListingPublishStatus } from "@/lib/server/database";

type JobsResponse = {
  ok: boolean;
  database?: boolean;
  jobs?: ListingPublishJobRecord[];
  job?: ListingPublishJobRecord;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchListingPublishJobs(input: {
  storeId?: string;
  platform?: string;
  limit?: number;
} = {}): Promise<ListingPublishJobRecord[] | undefined> {
  try {
    const params = new URLSearchParams();
    if (input.storeId) params.set("storeId", input.storeId);
    if (input.platform) params.set("platform", input.platform);
    if (input.limit) params.set("limit", String(input.limit));
    const suffix = params.size ? `?${params.toString()}` : "";
    const response = await fetch(`/api/listing-publish-jobs${suffix}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<JobsResponse>(response);
    return body?.jobs;
  } catch {
    return undefined;
  }
}

export async function createListingPublishJob(input: {
  storeId?: string | null;
  productId?: string | null;
  platform: string;
  status?: ListingPublishStatus;
  draft: Record<string, unknown>;
  validationIssues?: unknown[];
  externalProductId?: string | null;
  errorMessage?: string | null;
}): Promise<ListingPublishJobRecord | undefined> {
  try {
    const response = await fetch("/api/listing-publish-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return undefined;
    const body = await readJson<JobsResponse>(response);
    return body?.job;
  } catch {
    return undefined;
  }
}

export async function updateListingPublishJob(
  id: string,
  input: Partial<{
    storeId: string | null;
    productId: string | null;
    platform: string;
    status: ListingPublishStatus;
    draft: Record<string, unknown>;
    validationIssues: unknown[];
    externalProductId: string | null;
    errorMessage: string | null;
  }>
): Promise<ListingPublishJobRecord | undefined> {
  try {
    const response = await fetch("/api/listing-publish-jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...input }),
    });
    if (!response.ok) return undefined;
    const body = await readJson<JobsResponse>(response);
    return body?.job;
  } catch {
    return undefined;
  }
}
