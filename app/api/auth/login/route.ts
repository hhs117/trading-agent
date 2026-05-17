import { NextResponse } from "next/server";

import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server/auth";
import {
  getUserByEmail,
  markUserLoginInDb,
  writeAuditLogToDb,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password are required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
    }

    const session = await createSession(user.id);
    await markUserLoginInDb(user.id);
    await writeAuditLogToDb({
      userId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown login error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
