import { NextResponse } from "next/server";

import { isAuthResponse, requireUser } from "@/lib/server/auth";
import { aggregateStorePerformance, isDatabaseConfigured } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        database: false,
        message: "DATABASE_URL 未配置，无法聚合店铺真实表现",
        rows: [],
      },
      { status: 200 }
    );
  }

  try {
    const rows = await aggregateStorePerformance();
    return NextResponse.json({ ok: true, database: true, rows });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: true,
        message: error instanceof Error ? error.message : "店铺数据聚合失败",
        rows: [],
      },
      { status: 500 }
    );
  }
}
