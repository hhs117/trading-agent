import type { ScoringRecord } from "@/data/scoring";

type ScoringRecordsResponse = {
  ok: boolean;
  database?: boolean;
  deleted?: boolean;
  records?: ScoringRecord[];
  record?: ScoringRecord;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchApiScoringRecords(productId?: string): Promise<ScoringRecord[] | undefined> {
  try {
    const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
    const response = await fetch(`/api/scoring-records${query}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<ScoringRecordsResponse>(response);
    return body?.records;
  } catch {
    return undefined;
  }
}

export async function saveApiScoringRecord(record: ScoringRecord): Promise<ScoringRecord | undefined> {
  try {
    const response = await fetch("/api/scoring-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!response.ok) return undefined;
    const body = await readJson<ScoringRecordsResponse>(response);
    return body?.record;
  } catch {
    return undefined;
  }
}

export async function deleteApiScoringRecord(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/scoring-records?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return false;
    const body = await readJson<ScoringRecordsResponse>(response);
    return Boolean(body?.ok && body.database !== false);
  } catch {
    return false;
  }
}
