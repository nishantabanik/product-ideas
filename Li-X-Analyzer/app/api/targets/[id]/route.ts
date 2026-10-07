import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteTarget, updateTarget, type TargetPatch } from "@/lib/targets/store";
import { parseTargetInput } from "@/lib/targets/input";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = (await req.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const p = parseTargetInput(b ?? {}, true);
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  try {
    if (!(await updateTarget(id, p.value as TargetPatch))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  await deleteTarget((await params).id);
  return NextResponse.json({ ok: true });
}
