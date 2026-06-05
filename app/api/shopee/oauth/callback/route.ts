import { NextResponse } from "next/server";

import { encryptSecret, isTokenEncryptionConfigured } from "@/lib/server/crypto";
import {
  isDatabaseConfigured,
  upsertStoreAuthTokenInDb,
  writeAuditLogToDb,
} from "@/lib/server/database";
import { exchangeShopeeAuthCode, getShopeeIntegrationStatus } from "@/lib/server/shopee";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shopId = searchParams.get("shop_id");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.json(
      { ok: false, message: "Shopee authorization rejected", error: errorParam, state },
      { status: 400 }
    );
  }
  if (!code || !shopId) {
    return NextResponse.json(
      { ok: false, message: "Missing code or shop_id from Shopee callback", state },
      { status: 400 }
    );
  }

  const status = getShopeeIntegrationStatus();
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, message: "Shopee credentials are not configured", shopee: status },
      { status: 400 }
    );
  }
  if (!isTokenEncryptionConfigured()) {
    return NextResponse.json(
      { ok: false, message: "TOKEN_ENCRYPTION_KEY is not configured" },
      { status: 500 }
    );
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL is not configured" },
      { status: 500 }
    );
  }

  let token;
  try {
    token = await exchangeShopeeAuthCode({ code, shopId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Token exchange failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }

  const now = Date.now();
  const accessExpiresAt = new Date(now + (token.expire_in ?? 0) * 1000).toISOString();
  const refreshExpiresAt = token.refresh_token_expire_in
    ? new Date(now + token.refresh_token_expire_in * 1000).toISOString()
    : null;

  const record = await upsertStoreAuthTokenInDb({
    storeId: null,
    platform: "Shopee",
    externalShopId: shopId,
    accessTokenEncrypted: encryptSecret(token.access_token),
    refreshTokenEncrypted: encryptSecret(token.refresh_token),
    accessTokenExpiresAt: accessExpiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
    scopes: [],
    raw: { ...token, access_token: undefined, refresh_token: undefined },
  });

  await writeAuditLogToDb({
    userId: null,
    action: "shopee.oauth_callback",
    entityType: "store_auth_token",
    entityId: record.id,
    metadata: { shopId, state },
  });

  return NextResponse.json({
    ok: true,
    message: "Shopee shop authorized. Access token stored.",
    shopId,
    state,
    expiresAt: accessExpiresAt,
  });
}
