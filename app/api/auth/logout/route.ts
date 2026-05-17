import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  getCurrentUser,
  revokeCurrentSession,
} from "@/lib/server/auth";
import { writeAuditLogToDb } from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  await revokeCurrentSession();
  if (user) {
    await writeAuditLogToDb({
      userId: user.id,
      action: "auth.logout",
      entityType: "user",
      entityId: user.id,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
