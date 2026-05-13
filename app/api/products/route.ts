import { NextResponse } from "next/server";

import {
  isDatabaseConfigured,
  listProductsFromDb,
  upsertProductToDb,
} from "@/lib/server/database";
import type { MockProduct } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

export async function GET() {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const products = await listProductsFromDb();
    return NextResponse.json({ ok: true, database: true, products });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const product = (await request.json()) as MockProduct;
    if (!product?.id || !product.name) {
      return NextResponse.json({ ok: false, message: "Invalid product payload" }, { status: 400 });
    }

    const saved = await upsertProductToDb(product);
    return NextResponse.json({ ok: true, database: true, product: saved }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
