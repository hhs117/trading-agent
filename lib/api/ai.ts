type CopywritingInput = {
  title: string;
  sellingPoints: string;
  description: string;
  platform: string;
  market: string;
  language: string;
  style: string;
};

type CopywritingResult = {
  productTitle: string;
  bulletPoints: string[];
  detailDescription: string;
  seoKeywords: string[];
  platformTags: string[];
};

type CopywritingResponse = {
  ok: boolean;
  ai?: boolean;
  model?: string;
  result?: CopywritingResult;
};

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function generateCopywritingWithAi(
  input: CopywritingInput
): Promise<CopywritingResult | undefined> {
  try {
    const response = await fetch("/api/ai/copywriting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return undefined;
    const body = await readJson<CopywritingResponse>(response);
    return body?.ok ? body.result : undefined;
  } catch {
    return undefined;
  }
}
