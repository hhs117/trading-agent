import { createHash, createHmac } from "crypto";

import { NextResponse } from "next/server";

import { isAuthResponse, isRoleAllowed, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH = "/api/v2/shop/auth_partner";
const DEFAULT_BASE = "https://partner.test-stable.shopeemobile.com";

type Variant = {
  id: string;
  description: string;
  algo: "hmac-sha256" | "hmac-sha1" | "hmac-md5" | "sha256" | "md5";
  keyKind: "utf8-full" | "utf8-noprefix" | "hex-noprefix";
  baseOrder: "id-path-ts" | "id-ts-path" | "path-id-ts" | "ts-id-path";
};

const VARIANTS: Variant[] = [
  // Default Shopee v2 docs order: partner_id + path + timestamp
  { id: "A1", description: "HMAC-SHA256 utf8-full, id+path+ts", algo: "hmac-sha256", keyKind: "utf8-full", baseOrder: "id-path-ts" },
  { id: "A2", description: "HMAC-SHA256 utf8-noprefix, id+path+ts", algo: "hmac-sha256", keyKind: "utf8-noprefix", baseOrder: "id-path-ts" },
  { id: "A3", description: "HMAC-SHA256 hex-noprefix, id+path+ts", algo: "hmac-sha256", keyKind: "hex-noprefix", baseOrder: "id-path-ts" },
  // Alternate base orders
  { id: "B1", description: "HMAC-SHA256 utf8-full, path+id+ts", algo: "hmac-sha256", keyKind: "utf8-full", baseOrder: "path-id-ts" },
  { id: "B2", description: "HMAC-SHA256 utf8-full, id+ts+path", algo: "hmac-sha256", keyKind: "utf8-full", baseOrder: "id-ts-path" },
  // Different algorithms
  { id: "C1", description: "HMAC-SHA1 utf8-full, id+path+ts", algo: "hmac-sha1", keyKind: "utf8-full", baseOrder: "id-path-ts" },
  { id: "C2", description: "HMAC-MD5 utf8-full, id+path+ts", algo: "hmac-md5", keyKind: "utf8-full", baseOrder: "id-path-ts" },
  // Plain SHA256 with key as prefix
  { id: "D1", description: "SHA256(key+id+path+ts) plain hash", algo: "sha256", keyKind: "utf8-full", baseOrder: "id-path-ts" },
  { id: "D2", description: "MD5(key+id+path+ts) plain hash", algo: "md5", keyKind: "utf8-full", baseOrder: "id-path-ts" },
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
  }
}

function buildBase(order: Variant["baseOrder"], partnerId: string, path: string, timestamp: number): string {
  const ts = String(timestamp);
  switch (order) {
    case "id-path-ts": return partnerId + path + ts;
    case "id-ts-path": return partnerId + ts + path;
    case "path-id-ts": return path + partnerId + ts;
    case "ts-id-path": return ts + partnerId + path;
  }
}

function computeSign(algo: Variant["algo"], key: Buffer | string, base: string): string {
  switch (algo) {
    case "hmac-sha256":
      return createHmac("sha256", key).update(base).digest("hex");
    case "hmac-sha1":
      return createHmac("sha1", key).update(base).digest("hex");
    case "hmac-md5":
      return createHmac("md5", key).update(base).digest("hex");
    case "sha256":
      return createHash("sha256").update(key + base).digest("hex");
    case "md5":
      return createHash("md5").update(key + base).digest("hex");
  }
}

export async function GET() {
  const auth = await requireUser();
  if (isAuthResponse(auth)) return auth;
  if (!isRoleAllowed(auth, ["admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const partnerId = (process.env.SHOPEE_PARTNER_ID ?? "").trim();
  const partnerKey = (process.env.SHOPEE_PARTNER_KEY ?? "").trim();
  const redirect = (process.env.SHOPEE_REDIRECT_URL ?? "").trim();
  const baseUrl = (process.env.SHOPEE_AUTH_BASE_URL ?? "").trim() || DEFAULT_BASE;

  const timestamp = Math.floor(Date.now() / 1000);

  const results = await Promise.all(
    VARIANTS.map(async (v) => {
      const key = buildKey(v.keyKind, partnerKey);
      if (key === null) {
        return { ...v, sign: null, status: null, bodyHead: "key construction failed", isSignWrong: null };
      }
      const baseString = buildBase(v.baseOrder, partnerId, PATH, timestamp);
      const sign = computeSign(v.algo, key, baseString);
      const url = new URL(PATH, baseUrl);
      url.searchParams.set("partner_id", partnerId);
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("sign", sign);
      url.searchParams.set("redirect", redirect);
      url.searchParams.set("state", `probe-${v.id}`);

      try {
        const response = await fetch(url.toString(), { redirect: "manual" });
        const text = await response.text();
        const bodyHead = text.slice(0, 300);
        const isSignWrong =
          bodyHead.includes("error_sign") || bodyHead.includes("Wrong sign");
        return {
          ...v,
          baseString,
          sign,
          status: response.status,
          bodyHead,
          isSignWrong,
        };
      } catch (error) {
        return {
          ...v,
          baseString,
          sign,
          status: null,
          bodyHead: error instanceof Error ? error.message : String(error),
          isSignWrong: null,
        };
      }
    })
  );

  const accepted = results.filter((r) => r.isSignWrong === false);

  // Diagnostic byte dump of the secret (length + first/last 2 byte hex + non-ascii flag)
  const keyBytes = Buffer.from(partnerKey, "utf8");
  const hasNonAscii = keyBytes.some((b) => b > 127 || b < 32);

  return NextResponse.json({
    ok: true,
    serverTimeUnix: timestamp,
    keyDiagnostic: {
      utf8Length: keyBytes.length,
      first2BytesHex: keyBytes.slice(0, 2).toString("hex"),
      last2BytesHex: keyBytes.slice(-2).toString("hex"),
      hasNonAsciiOrControl: hasNonAscii,
    },
    summary: {
      acceptedVariants: accepted.map((r) => r.id),
      message:
        accepted.length === 0
          ? "All variants got 'Wrong sign'. Likely cause: partner_key in Vercel does NOT match Shopee backend. Reset the key in Shopee, copy fresh, update Vercel."
          : accepted.length === 1
            ? `Variant ${accepted[0].id} is correct: ${accepted[0].description}`
            : `Multiple variants accepted (unusual): ${accepted.map((r) => r.id).join(", ")}`,
    },
    results,
  });
}
