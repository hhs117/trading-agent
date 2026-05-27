import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { writeAuditLogToDb } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ImageGenerationInput = {
  prompt: string;
  productName?: string;
  platform?: string;
  market?: string;
  imageType?: string;
  style?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  background?: "auto" | "opaque" | "transparent";
};

const DEFAULT_IMAGE_MODEL = "gpt-image-1.5";
const SIZES = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);
const QUALITIES = new Set(["low", "medium", "high", "auto"]);
const BACKGROUNDS = new Set(["auto", "opaque", "transparent"]);

function unavailable() {
  return NextResponse.json(
    {
      ok: false,
      ai: false,
      message: "OPENAI_API_KEY is not configured.",
    },
    { status: 200 }
  );
}

function validateInput(input: ImageGenerationInput) {
  return Boolean(
    input &&
      typeof input.prompt === "string" &&
      input.prompt.trim().length >= 8 &&
      input.prompt.trim().length <= 32000
  );
}

function buildPrompt(input: ImageGenerationInput) {
  const parts = [
    input.prompt.trim(),
    input.productName ? `Product: ${input.productName.trim()}` : "",
    input.platform ? `Marketplace: ${input.platform.trim()}` : "",
    input.market ? `Target market: ${input.market.trim()}` : "",
    input.imageType ? `Image type: ${input.imageType.trim()}` : "",
    input.style ? `Visual style: ${input.style.trim()}` : "",
    "Create a commercially usable ecommerce product image.",
    "Keep the product clearly visible, avoid clutter, avoid platform-prohibited claims, and leave clean space for optional marketplace copy.",
  ].filter(Boolean);
  return parts.join("\n");
}

function extractImage(data: unknown): { b64Json?: string; url?: string; revisedPrompt?: string } | null {
  if (!data || typeof data !== "object") return null;
  const records = (data as Record<string, unknown>).data;
  if (!Array.isArray(records) || !records[0] || typeof records[0] !== "object") return null;
  const first = records[0] as Record<string, unknown>;
  const b64Json = typeof first.b64_json === "string" ? first.b64_json : undefined;
  const url = typeof first.url === "string" ? first.url : undefined;
  const revisedPrompt = typeof first.revised_prompt === "string" ? first.revised_prompt : undefined;
  return b64Json || url ? { b64Json, url, revisedPrompt } : null;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return unavailable();

  try {
    const input = (await request.json()) as ImageGenerationInput;
    if (!validateInput(input)) {
      return NextResponse.json(
        { ok: false, message: "Prompt must be between 8 and 32000 characters." },
        { status: 400 }
      );
    }

    const size = SIZES.has(input.size ?? "") ? input.size : "1024x1024";
    const quality = QUALITIES.has(input.quality ?? "") ? input.quality : "medium";
    const background = BACKGROUNDS.has(input.background ?? "") ? input.background : "auto";
    const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(input),
        n: 1,
        size,
        quality,
        background,
      }),
    });

    const data = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? JSON.stringify((data as { error: unknown }).error)
          : "Image generation request failed";
      return NextResponse.json({ ok: false, ai: true, model, message }, { status: 502 });
    }

    const image = extractImage(data);
    if (!image) {
      return NextResponse.json(
        { ok: false, ai: true, model, message: "Image generation returned no image data" },
        { status: 502 }
      );
    }

    await writeAuditLogToDb({
      userId: auth.id,
      action: "ai.image_generated",
      entityType: "ai_generation",
      metadata: { model, size, quality, background, imageType: input.imageType ?? null },
    });

    return NextResponse.json({
      ok: true,
      ai: true,
      model,
      image: {
        b64Json: image.b64Json,
        url: image.url,
        revisedPrompt: image.revisedPrompt,
        mimeType: "image/png",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown image generation error";
    return NextResponse.json({ ok: false, ai: true, message }, { status: 500 });
  }
}
