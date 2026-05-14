import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveAiProvider() {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase();
  if (configured === "deepseek" || configured === "openai") return configured;
  return process.env.DEEPSEEK_API_KEY ? "deepseek" : "openai";
}

export async function GET() {
  const aiProvider = resolveAiProvider();
  return NextResponse.json({
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
    aiConfigured:
      aiProvider === "deepseek"
        ? Boolean(process.env.DEEPSEEK_API_KEY)
        : Boolean(process.env.OPENAI_API_KEY),
    aiProvider,
    aiModel:
      aiProvider === "deepseek"
        ? process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || "deepseek-v4-flash"
        : process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-5-mini",
    timestamp: new Date().toISOString(),
  });
}
