import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    aiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    timestamp: new Date().toISOString(),
  });
}
