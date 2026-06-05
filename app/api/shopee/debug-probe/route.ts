import { createHmac } from "crypto";

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
  { id: "D", description: "Full key hex-decoded", keyKind: "hex-full" },
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
  const baseString = `${partnerId}${PATH}${timestamp}`;

  const results = await Promise.all(
    VARIANTS.map(async (v) => {
      const key = buildKey(v.keyKind, partnerKey);
      if (key === null) {
        return { ...v, sign: null, status: null, bodyHead: "key construction failed", isSignWrong: null };
      }
      const sign = createHmac("sha256", key).update(baseString).digest("hex");
      const url = new URL(PATH, baseUrl);
      url.searchParams.set("partner_id", partnerId);
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("sign", sign);
      url.searchParams.set("redirect", redirect);
      url.searchParams.set("state", `probe-${v.id}`);

      try {
        const response = await fetch(url.toString(), { redirect: "manual" });
        const text = await response.text();
        const bodyHead = text.slice(0, 400);
        const isSignWrong =
          bodyHead.includes("error_sign") || bodyHead.includes("Wrong sign");
        const looksLikeHtml = bodyHead.trim().startsWith("<");
        return {
          ...v,
          sign,
          status: response.status,
          contentType: response.headers.get("content-type"),
          location: response.headers.get("location"),
          bodyHead,
          isSignWrong,
          looksLikeHtml,
        };
      } catch (error) {
        return {
          ...v,
          sign,
          status: null,
          bodyHead: error instanceof Error ? error.message : String(error),
          isSignWrong: null,
        };
      }
    })
  );

  const accepted = results.filter((r) => r.isSignWrong === false);

  return NextResponse.json({
    ok: true,
    serverTimeUnix: timestamp,
    baseString,
    summary: {
      acceptedVariants: accepted.map((r) => r.id),
      message:
        accepted.length === 0
          ? "All 4 variants got 'Wrong sign' — none of these key interpretations work"
          : accepted.length === 1
            ? `Variant ${accepted[0].id} is correct: ${accepted[0].description}`
            : `Multiple variants accepted (unusual): ${accepted.map((r) => r.id).join(", ")}`,
    },
    results,
  });
}
