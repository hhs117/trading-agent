import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/server/auth";
import {
  countUsers,
  createUserInDb,
  writeAuditLogToDb,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const expectedToken = process.env.BOOTSTRAP_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ ok: false, message: "Bootstrap is disabled" }, { status: 404 });
  }

  if (request.headers.get("x-bootstrap-token") !== expectedToken) {
    return NextResponse.json({ ok: false, message: "Invalid bootstrap token" }, { status: 401 });
  }

  if ((await countUsers()) > 0) {
    return NextResponse.json({ ok: false, message: "Users already exist" }, { status: 409 });
  }

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
  };
  const email = body.email?.trim();
  const name = body.name?.trim();
  if (!email || !name || !body.password || body.password.length < 10) {
    return NextResponse.json({ ok: false, message: "Invalid bootstrap payload" }, { status: 400 });
  }

  const user = await createUserInDb({
    email,
    name,
    passwordHash: hashPassword(body.password),
    role: "admin",
  });
  await writeAuditLogToDb({
    userId: user.id,
    action: "auth.bootstrap_admin",
    entityType: "user",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
