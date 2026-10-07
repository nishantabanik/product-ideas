import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { engage } from "@/lib/targets/store";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { note?: unknown };
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 300) : null;
  try {
    if (!(await engage(id, note))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
