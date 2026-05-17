import { NextResponse } from "next/server";

import {
  hashPassword,
  isAuthResponse,
  isRoleAllowed,
  requireUser,
} from "@/lib/server/auth";
import {
  createUserInDb,
  listUsersFromDb,
  writeAuditLogToDb,
  type UserRole,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = new Set<UserRole>(["admin", "operator", "viewer"]);

async function requireAdmin() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function GET() {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const users = await listUsersFromDb();
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
    role?: UserRole;
  };
  const email = body.email?.trim();
  const name = body.name?.trim();
  const role = body.role;
  if (!email || !name || !body.password || body.password.length < 10 || !role || !ROLES.has(role)) {
    return NextResponse.json({ ok: false, message: "Invalid user payload" }, { status: 400 });
  }

  try {
    const user = await createUserInDb({
      email,
      name,
      passwordHash: hashPassword(body.password),
      role,
    });
    await writeAuditLogToDb({
      userId: auth.id,
      action: "user.created",
      entityType: "user",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown user creation error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
