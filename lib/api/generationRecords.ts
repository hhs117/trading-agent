import type { GenerationKind, GenerationRecord } from "@/lib/server/database";

type RecordsResponse<Input, Result> = {
  ok: boolean;
  database?: boolean;
  deleted?: boolean | number;
  records?: Array<GenerationRecord<Input, Result>>;
  record?: GenerationRecord<Input, Result>;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function fetchGenerationRecords<Input, Result>(
  kind: GenerationKind
): Promise<Array<GenerationRecord<Input, Result>> | undefined> {
  try {
    const response = await fetch(`/api/generation-records?kind=${encodeURIComponent(kind)}`, {
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    const body = await readJson<RecordsResponse<Input, Result>>(response);
    return body?.records;
  } catch {
    return undefined;
  }
}

export async function saveGenerationRecord<Input, Result>(
  record: GenerationRecord<Input, Result>
): Promise<GenerationRecord<Input, Result> | undefined> {
  try {
    const response = await fetch("/api/generation-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!response.ok) return undefined;
    const body = await readJson<RecordsResponse<Input, Result>>(response);
    return body?.record;
  } catch {
    return undefined;
  }
}

export async function deleteGenerationRecord(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/generation-records?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return false;
    const body = await readJson<RecordsResponse<unknown, unknown>>(response);
    return Boolean(body?.ok && body.database !== false);
  } catch {
    return false;
  }
}

export async function clearGenerationRecords(kind: GenerationKind): Promise<boolean> {
  try {
    const response = await fetch(`/api/generation-records?kind=${encodeURIComponent(kind)}`, {
      method: "DELETE",
    });
    if (!response.ok) return false;
    const body = await readJson<RecordsResponse<unknown, unknown>>(response);
    return Boolean(body?.ok && body.database !== false);
  } catch {
    return false;
  }
}
