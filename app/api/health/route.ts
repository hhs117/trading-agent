import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
