import { NextResponse } from "next/server";

import {
  deleteProductFromDb,
  getProductFromDb,
  isDatabaseConfigured,
  upsertProductToDb,
} from "@/lib/server/database";
import type { MockProduct } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

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

export async function GET(_request: Request, { params }: Context) {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const product = await getProductFromDb(params.id);
    if (!product) {
      return NextResponse.json({ ok: false, database: true, message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, database: true, product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const product = (await request.json()) as MockProduct;
    if (!product?.id || product.id !== params.id || !product.name) {
      return NextResponse.json({ ok: false, message: "Invalid product payload" }, { status: 400 });
    }

    const saved = await upsertProductToDb(product);
    return NextResponse.json({ ok: true, database: true, product: saved });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const deleted = await deleteProductFromDb(params.id);
    return NextResponse.json({ ok: true, database: true, deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
