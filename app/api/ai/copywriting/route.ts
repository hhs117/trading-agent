import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

const DEFAULT_MODEL = "gpt-5-mini";

function unavailable() {
  return NextResponse.json(
    { ok: false, ai: false, message: "OPENAI_API_KEY is not configured" },
    { status: 200 }
  );
}

function safeJsonParse(text: string): CopywritingResult | null {
  try {
    return JSON.parse(text) as CopywritingResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as CopywritingResult;
    } catch {
      return null;
    }
  }
}

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = record.output;
  if (!Array.isArray(output)) return "";

  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("\n");
}

function validateInput(input: CopywritingInput) {
  return Boolean(
    input &&
      typeof input.title === "string" &&
      typeof input.sellingPoints === "string" &&
      typeof input.description === "string" &&
      typeof input.platform === "string" &&
      typeof input.market === "string" &&
      typeof input.language === "string" &&
      typeof input.style === "string"
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return unavailable();

  try {
    const input = (await request.json()) as CopywritingInput;
    if (!validateInput(input)) {
      return NextResponse.json({ ok: false, message: "Invalid copywriting input" }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "你是跨境电商多语言文案专家。根据中文商品信息生成适合目标平台、目标市场和目标语言的商品文案。输出必须是严格 JSON，不能包含 Markdown。",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "seapick_copywriting_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "productTitle",
                "bulletPoints",
                "detailDescription",
                "seoKeywords",
                "platformTags",
              ],
              properties: {
                productTitle: {
                  type: "string",
                  description: "目标语言商品标题，适合目标平台展示。",
                },
                bulletPoints: {
                  type: "array",
                  minItems: 5,
                  maxItems: 5,
                  items: { type: "string" },
                  description: "五点卖点，每条突出一个购买理由。",
                },
                detailDescription: {
                  type: "string",
                  description: "详情页描述，强调场景、材质、价值和转化。",
                },
                seoKeywords: {
                  type: "array",
                  minItems: 6,
                  maxItems: 12,
                  items: { type: "string" },
                },
                platformTags: {
                  type: "array",
                  minItems: 4,
                  maxItems: 10,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      }),
    });

    const data = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? JSON.stringify((data as { error: unknown }).error)
          : "OpenAI request failed";
      return NextResponse.json({ ok: false, ai: true, message }, { status: 502 });
    }

    const outputText = extractOutputText(data);
    const result = safeJsonParse(outputText);
    if (!result) {
      return NextResponse.json({ ok: false, ai: true, message: "AI returned invalid JSON" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, ai: true, model, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    return NextResponse.json({ ok: false, ai: true, message }, { status: 500 });
  }
}
