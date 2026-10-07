import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { addTemplate, deleteTemplate } from "@/lib/studio/store";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { name?: string; body?: string; platform?: string; kind?: string };
  if (!b.name?.trim() || !b.body?.trim()) return NextResponse.json({ error: "A name and the text are both needed." }, { status: 400 });
  await addTemplate({ name: b.name.trim().slice(0, 80), body: b.body.trim().slice(0, 3000), platform: b.platform === "x" || b.platform === "linkedin" ? b.platform : "both", kind: b.kind === "hook" ? "hook" : "template" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = (await req.json()) as { id?: string };
  if (id) await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
