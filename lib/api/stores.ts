import type { StoreRecord } from "@/lib/server/database";

type StoresResponse = {
  ok: boolean;
  database?: boolean;
  stores?: StoreRecord[];
  store?: StoreRecord;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchApiStores(): Promise<StoreRecord[] | undefined> {
  try {
    const response = await fetch("/api/stores", { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = await readJson<StoresResponse>(response);
    return body?.stores;
  } catch {
    return undefined;
  }
}

export async function createApiStore(input: {
  name: string;
  platform: string;
  market: string;
  sellerId?: string;
  currency: string;
  timezone: string;
  sourceType: StoreRecord["sourceType"];
  connectionStatus: StoreRecord["connectionStatus"];
  notes?: string;
}): Promise<StoreRecord | undefined> {
  try {
    const response = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return undefined;
    const body = await readJson<StoresResponse>(response);
    return body?.store;
  } catch {
    return undefined;
  }
}

export async function updateApiStore(
  id: string,
  input: Partial<
    Pick<
      StoreRecord,
      | "name"
      | "platform"
      | "market"
      | "sellerId"
      | "currency"
      | "timezone"
      | "sourceType"
      | "connectionStatus"
      | "isActive"
      | "notes"
    >
  >
): Promise<StoreRecord | undefined> {
  try {
    const response = await fetch(`/api/stores/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return undefined;
    const body = await readJson<StoresResponse>(response);
    return body?.store;
  } catch {
    return undefined;
  }
}
