import { NextResponse } from "next/server";

import {
  hashPassword,
  isAuthResponse,
  isRoleAllowed,
  requireUser,
} from "@/lib/server/auth";
import {
  getUserById,
  revokeSessionsForUserInDb,
  updateUserInDb,
  updateUserPasswordInDb,
  writeAuditLogToDb,
  type UserRole,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = new Set<UserRole>(["admin", "operator", "viewer"]);

type Context = {
  params: {
    id: string;
  };
};

async function requireAdmin() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireAdmin();
  if (isAuthResponse(auth)) return auth;

  const current = await getUserById(params.id);
  if (!current) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    role?: UserRole;
    isActive?: boolean;
    password?: string;
  };

  if (body.role && !ROLES.has(body.role)) {
    return NextResponse.json({ ok: false, message: "Invalid role" }, { status: 400 });
  }
  if (typeof body.password === "string" && body.password.length < 10) {
    return NextResponse.json(
      { ok: false, message: "Password must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (params.id === auth.id && body.role && body.role !== auth.role) {
    return NextResponse.json({ ok: false, message: "Cannot change your own role" }, { status: 400 });
  }
  if (params.id === auth.id && body.isActive === false) {
    return NextResponse.json({ ok: false, message: "Cannot deactivate your own account" }, { status: 400 });
  }

  let user = current;
  if (body.role || typeof body.isActive === "boolean") {
    const updated = await updateUserInDb(params.id, {
      role: body.role,
      isActive: body.isActive,
    });
    if (updated) user = updated;
  }

  if (typeof body.password === "string") {
    await updateUserPasswordInDb(params.id, hashPassword(body.password), true);
    await revokeSessionsForUserInDb(params.id);
    const updated = await getUserById(params.id);
    if (updated) user = updated;
  }

  await writeAuditLogToDb({
    userId: auth.id,
    action: "user.updated",
    entityType: "user",
    entityId: user.id,
    metadata: {
      roleChanged: Boolean(body.role),
      activeChanged: typeof body.isActive === "boolean",
      passwordReset: typeof body.password === "string",
    },
  });

  return NextResponse.json({ ok: true, user });
}
