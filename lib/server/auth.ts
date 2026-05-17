import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  countUsers,
  createSessionInDb,
  createUserInDb,
  getSessionUserByTokenHash,
  revokeSessionByTokenHash,
  type AppUser,
  type UserRole,
} from "@/lib/server/database";

const SESSION_COOKIE = "seapick_session";
const SESSION_DAYS = 14;
const PASSWORD_KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function bootstrapAdminIfNeeded() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";
  if (!email || !password) return;
  if ((await countUsers()) > 0) return;

  await createUserInDb({
    email,
    name,
    passwordHash: hashPassword(password),
    role: "admin",
  });
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await createSessionInDb({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: expiresAt.toISOString(),
  });
  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUserByTokenHash(hashSessionToken(token));
}

export async function revokeCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await revokeSessionByTokenHash(hashSessionToken(token));
}

export async function requireUser(): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isRoleAllowed(user: AppUser, roles: UserRole[]) {
  return roles.includes(user.role);
}

export function isAuthResponse(value: AppUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
