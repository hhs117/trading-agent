import { NextResponse } from "next/server";

import {
  clearGenerationRecordsFromDb,
  deleteGenerationRecordFromDb,
  isDatabaseConfigured,
  listGenerationRecordsFromDb,
  saveGenerationRecordToDb,
  type GenerationKind,
  type GenerationRecord,
} from "@/lib/server/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GENERATION_KINDS = new Set<GenerationKind>([
  "copywriting",
  "finance",
  "ai_prompts",
  "image_review",
  "customer_reply",
  "logistics",
  "security",
]);

function unavailable() {
  return NextResponse.json(
    { ok: false, database: false, message: "DATABASE_URL is not configured" },
    { status: 200 }
  );
}

function parseKind(value: string | null): GenerationKind | null {
  if (!value || !GENERATION_KINDS.has(value as GenerationKind)) return null;
  return value as GenerationKind;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return NextResponse.json({ ok: false, database: true, message }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return unavailable();

  const { searchParams } = new URL(request.url);
  const kind = parseKind(searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ ok: false, message: "Invalid generation kind" }, { status: 400 });
  }

  try {
    const records = await listGenerationRecordsFromDb(kind);
    return NextResponse.json({ ok: true, database: true, records });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as Partial<GenerationRecord>;
    const kind = parseKind(body.kind ?? null);
    if (!kind || !body.input || !body.result) {
      return NextResponse.json({ ok: false, message: "Invalid generation record" }, { status: 400 });
    }

    const record = await saveGenerationRecordToDb({
      id: body.id || crypto.randomUUID(),
      kind,
      sourceId: body.sourceId ?? null,
      createdAt: body.createdAt,
      input: body.input,
      result: body.result,
    });
    return NextResponse.json({ ok: true, database: true, record }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) return unavailable();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const kind = parseKind(searchParams.get("kind"));

  try {
    if (id) {
      const deleted = await deleteGenerationRecordFromDb(id);
      return NextResponse.json({ ok: true, database: true, deleted });
    }

    if (kind) {
      const deleted = await clearGenerationRecordsFromDb(kind);
      return NextResponse.json({ ok: true, database: true, deleted });
    }

    return NextResponse.json({ ok: false, message: "Missing id or kind" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
