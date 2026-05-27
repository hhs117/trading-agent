import type { CompetitorItem } from "@/data/phase5";

type CompareItemsResponse = {
  ok: boolean;
  database?: boolean;
  items?: CompetitorItem[];
  ids?: string[];
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchApiCompareItems(): Promise<CompetitorItem[] | undefined> {
  try {
    const response = await fetch("/api/compare-items", { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<CompareItemsResponse>(response);
    return body?.items;
  } catch {
    return undefined;
  }
}

export async function saveApiCompareItems(items: CompetitorItem[]): Promise<CompetitorItem[] | undefined> {
  try {
    const response = await fetch("/api/compare-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) return undefined;
    const body = await readJson<CompareItemsResponse>(response);
    return body?.items;
  } catch {
    return undefined;
  }
}
