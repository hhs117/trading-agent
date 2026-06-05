import { createHmac, randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH = "/api/v2/shop/auth_partner";
const DEFAULT_BASE = "https://partner.test-stable.shopeemobile.com";

type Variant = {
  id: "A" | "B" | "C" | "D";
  description: string;
  keyKind: "utf8-full" | "utf8-noprefix" | "hex-noprefix" | "hex-full";
};

const VARIANTS: Variant[] = [
  { id: "A", description: "Full key incl. shpk prefix as UTF-8", keyKind: "utf8-full" },
  { id: "B", description: "Strip shpk prefix, use as UTF-8", keyKind: "utf8-noprefix" },
  { id: "C", description: "Strip shpk prefix, hex-decode to raw bytes", keyKind: "hex-noprefix" },
  { id: "D", description: "Full key hex-decoded (likely invalid)", keyKind: "hex-full" },
];

function buildKey(kind: Variant["keyKind"], raw: string): Buffer | string | null {
  switch (kind) {
    case "utf8-full":
      return raw;
    case "utf8-noprefix":
      return raw.startsWith("shpk") ? raw.slice(4) : raw;
    case "hex-noprefix":
      try {
        return Buffer.from(raw.startsWith("shpk") ? raw.slice(4) : raw, "hex");
      } catch {
        return null;
      }
    case "hex-full":
      try {
        return Buffer.from(raw, "hex");
      } catch {
        return null;
      }
  }
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const partnerIdRaw = process.env.SHOPEE_PARTNER_ID ?? "";
  const partnerKeyRaw = process.env.SHOPEE_PARTNER_KEY ?? "";
  const redirectRaw = process.env.SHOPEE_REDIRECT_URL ?? "";
  const baseRaw = process.env.SHOPEE_AUTH_BASE_URL ?? "";

  const partnerId = partnerIdRaw.trim();
  const partnerKey = partnerKeyRaw.trim();
  const redirect = redirectRaw.trim();
  const baseUrl = baseRaw.trim() || DEFAULT_BASE;

  const timestamp = Math.floor(Date.now() / 1000);
  const baseString = `${partnerId}${PATH}${timestamp}`;
  const state = randomUUID();

  const variants = VARIANTS.map((v) => {
    const key = buildKey(v.keyKind, partnerKey);
    if (key === null) {
      return { ...v, sign: null, url: null, error: "key construction failed" };
    }
    const sign = createHmac("sha256", key).update(baseString).digest("hex");
    const url = new URL(PATH, baseUrl);
    url.searchParams.set("partner_id", partnerId);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("sign", sign);
    url.searchParams.set("redirect", redirect);
    url.searchParams.set("state", `${state}-${v.id}`);
    return { ...v, sign, url: url.toString() };
  });

  const mask = (s: string) =>
    s.length <= 8 ? "***" : `${s.slice(0, 4)}...${s.slice(-4)} (len=${s.length})`;

  return NextResponse.json({
    ok: true,
    serverTimeUnix: timestamp,
    serverTimeIso: new Date(timestamp * 1000).toISOString(),
    env: {
      partnerId: { masked: mask(partnerIdRaw), trimmedLength: partnerId.length },
      partnerKey: {
        masked: mask(partnerKeyRaw),
        trimmedLength: partnerKey.length,
        startsWithShpk: partnerKey.startsWith("shpk"),
      },
      redirectUrl: redirect,
      authBaseUrl: baseUrl,
    },
    baseString,
    instructions: [
      "Click each variant URL below in order: A → B → C → D",
      "Whichever variant does NOT return 'Wrong sign' is the correct key interpretation",
      "Tell me which variant worked and I will fix the signing code accordingly",
    ],
    variants,
  });
}
