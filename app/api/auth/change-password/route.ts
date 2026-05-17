import { NextResponse } from "next/server";

import {
  hashPassword,
  isAuthResponse,
  requireUser,
  verifyPassword,
} from "@/lib/server/auth";
import {
  getUserByEmail,
  updateUserPasswordInDb,
  writeAuditLogToDb,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;

  const body = (await request.json()) as {
    currentPassword?: string;
    nextPassword?: string;
  };
  if (!body.currentPassword || !body.nextPassword || body.nextPassword.length < 10) {
    return NextResponse.json(
      { ok: false, message: "Password must be at least 10 characters" },
      { status: 400 }
    );
  }

  const userWithHash = await getUserByEmail(auth.email);
  if (!userWithHash || !verifyPassword(body.currentPassword, userWithHash.passwordHash)) {
    return NextResponse.json({ ok: false, message: "Current password is incorrect" }, { status: 400 });
  }

  await updateUserPasswordInDb(auth.id, hashPassword(body.nextPassword), false);
  await writeAuditLogToDb({
    userId: auth.id,
    action: "auth.password_changed",
    entityType: "user",
    entityId: auth.id,
  });

  return NextResponse.json({ ok: true });
}
