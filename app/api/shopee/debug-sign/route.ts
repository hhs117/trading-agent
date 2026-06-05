import { createHmac } from "crypto";

import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const partnerIdRaw = process.env.SHOPEE_PARTNER_ID ?? "";
  const partnerKeyRaw = process.env.SHOPEE_PARTNER_KEY ?? "";
  const redirectRaw = process.env.SHOPEE_REDIRECT_URL ?? "";
  const baseUrlRaw = process.env.SHOPEE_AUTH_BASE_URL ?? "";

  const partnerId = partnerIdRaw.trim();
  const partnerKey = partnerKeyRaw.trim();

  const path = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  const baseString = `${partnerId}${path}${timestamp}`;
  const sign = partnerKey
    ? createHmac("sha256", partnerKey).update(baseString).digest("hex")
    : null;

  const mask = (s: string) =>
    s.length <= 8 ? "***" : `${s.slice(0, 4)}...${s.slice(-4)} (len=${s.length})`;

  return NextResponse.json({
    ok: true,
    serverTimeUnix: timestamp,
    serverTimeIso: new Date(timestamp * 1000).toISOString(),
    env: {
      partnerId: {
        masked: mask(partnerIdRaw),
        rawLength: partnerIdRaw.length,
        trimmedLength: partnerId.length,
        hadWhitespace: partnerIdRaw !== partnerId,
        isNumeric: /^\d+$/.test(partnerId),
      },
      partnerKey: {
        masked: mask(partnerKeyRaw),
        rawLength: partnerKeyRaw.length,
        trimmedLength: partnerKey.length,
        hadWhitespace: partnerKeyRaw !== partnerKey,
        startsWithShpk: partnerKey.startsWith("shpk"),
      },
      redirectUrl: {
        masked: redirectRaw,
        rawLength: redirectRaw.length,
        trimmedLength: redirectRaw.trim().length,
        hadWhitespace: redirectRaw !== redirectRaw.trim(),
      },
      authBaseUrl: baseUrlRaw.trim() || null,
    },
    signing: {
      baseString,
      sign,
      method: "HMAC-SHA256(partner_key, partner_id + path + timestamp) as hex",
    },
  });
}
