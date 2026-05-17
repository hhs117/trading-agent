import { NextResponse } from "next/server";
import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { writeAuditLogToDb } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AiProvider = "deepseek" | "openai";

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

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["productTitle", "bulletPoints", "detailDescription", "seoKeywords", "platformTags"],
  properties: {
    productTitle: {
      type: "string",
      description: "Product title in the target language, optimized for the selected marketplace.",
    },
    bulletPoints: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: { type: "string" },
      description: "Exactly five selling points, one purchase reason per bullet.",
    },
    detailDescription: {
      type: "string",
      description: "Detail page description covering scenario, material, value, and conversion.",
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
} as const;

function resolveProvider(): { provider: AiProvider; apiKey?: string; model: string } | null {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase();
  const provider: AiProvider =
    configured === "openai" || configured === "deepseek"
      ? configured
      : process.env.DEEPSEEK_API_KEY
        ? "deepseek"
        : "openai";

  if (provider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY
      ? {
          provider,
          apiKey: process.env.DEEPSEEK_API_KEY,
          model: process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || DEFAULT_DEEPSEEK_MODEL,
        }
      : null;
  }

  return process.env.OPENAI_API_KEY
    ? {
        provider,
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || process.env.AI_MODEL || DEFAULT_OPENAI_MODEL,
      }
    : null;
}

function unavailable() {
  return NextResponse.json(
    {
      ok: false,
      ai: false,
      message: "AI provider key is not configured. Set DEEPSEEK_API_KEY or OPENAI_API_KEY.",
    },
    { status: 200 }
  );
}

function buildPrompt(input: CopywritingInput) {
  return [
    "Generate cross-border ecommerce copy from this Chinese product brief.",
    "Follow the target platform, target market, target language, and style.",
    "Return strict JSON only. Do not include Markdown or comments.",
    "JSON shape:",
    JSON.stringify({
      productTitle: "string",
      bulletPoints: ["string", "string", "string", "string", "string"],
      detailDescription: "string",
      seoKeywords: ["string"],
      platformTags: ["string"],
    }),
    "Input:",
    JSON.stringify(input),
  ].join("\n");
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

function extractOpenAIOutputText(data: unknown): string {
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

function extractChatOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const choices = (data as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return "";
  const first = choices[0];
  if (!first || typeof first !== "object") return "";
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return "";
  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" ? content : "";
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

function validateResult(result: CopywritingResult | null): result is CopywritingResult {
  return Boolean(
    result &&
      typeof result.productTitle === "string" &&
      Array.isArray(result.bulletPoints) &&
      result.bulletPoints.length === 5 &&
      typeof result.detailDescription === "string" &&
      Array.isArray(result.seoKeywords) &&
      Array.isArray(result.platformTags)
  );
}

async function generateWithOpenAI(apiKey: string, model: string, input: CopywritingInput) {
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
            "You are a cross-border ecommerce multilingual copywriting expert. Output strict JSON only.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "seapick_copywriting_result",
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    }),
  });

  const data = (await response.json()) as unknown;
  return {
    ok: response.ok,
    data,
    outputText: extractOpenAIOutputText(data),
  };
}

async function generateWithDeepSeek(apiKey: string, model: string, input: CopywritingInput) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a cross-border ecommerce multilingual copywriting expert. Output strict JSON only.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1800,
      stream: false,
    }),
  });

  const data = (await response.json()) as unknown;
  return {
    ok: response.ok,
    data,
    outputText: extractChatOutputText(data),
  };
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  const config = resolveProvider();
  if (!config?.apiKey) return unavailable();

  try {
    const input = (await request.json()) as CopywritingInput;
    if (!validateInput(input)) {
      return NextResponse.json({ ok: false, message: "Invalid copywriting input" }, { status: 400 });
    }

    const generation =
      config.provider === "deepseek"
        ? await generateWithDeepSeek(config.apiKey, config.model, input)
        : await generateWithOpenAI(config.apiKey, config.model, input);

    if (!generation.ok) {
      const message =
        generation.data && typeof generation.data === "object" && "error" in generation.data
          ? JSON.stringify((generation.data as { error: unknown }).error)
          : "AI request failed";
      return NextResponse.json(
        { ok: false, ai: true, provider: config.provider, model: config.model, message },
        { status: 502 }
      );
    }

    const result = safeJsonParse(generation.outputText);
    if (!validateResult(result)) {
      return NextResponse.json(
        {
          ok: false,
          ai: true,
          provider: config.provider,
          model: config.model,
          message: "AI returned invalid JSON",
        },
        { status: 502 }
      );
    }

    await writeAuditLogToDb({
      userId: auth.id,
      action: "ai.copywriting_generated",
      entityType: "ai_generation",
      metadata: { provider: config.provider, model: config.model },
    });

    return NextResponse.json({
      ok: true,
      ai: true,
      provider: config.provider,
      model: config.model,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    return NextResponse.json({ ok: false, ai: true, message }, { status: 500 });
  }
}
