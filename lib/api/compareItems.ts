type CompareItemsResponse = {
  ok: boolean;
  database?: boolean;
  ids?: string[];
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchApiCompareIds(): Promise<string[] | undefined> {
  try {
    const response = await fetch("/api/compare-items", { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<CompareItemsResponse>(response);
    return body?.ids;
  } catch {
    return undefined;
  }
}

export async function saveApiCompareIds(ids: string[]): Promise<string[] | undefined> {
  try {
    const response = await fetch("/api/compare-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) return undefined;
    const body = await readJson<CompareItemsResponse>(response);
    return body?.ids;
  } catch {
    return undefined;
  }
}
