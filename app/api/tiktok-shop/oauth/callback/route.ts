import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ ok: false, message: "TikTok Shop authorization failed", error, state });
  }

  if (!code) {
    return NextResponse.json({ ok: false, message: "Missing authorization code", state }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Authorization code received. Token exchange and encrypted token storage are the next implementation step.",
    codeReceived: true,
    state,
  });
}
