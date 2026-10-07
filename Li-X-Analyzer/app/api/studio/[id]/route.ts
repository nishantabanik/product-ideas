import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteDraft, getDraft, updateDraft, type DraftInput } from "@/lib/studio/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const b = (await req.json()) as DraftInput;
  const cur = await getDraft(id);
  if (!cur) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (cur.status === "scheduled" || cur.status === "published") return NextResponse.json({ error: "A scheduled post is already in Postiz. Change it there, or copy it into a new draft." }, { status: 409 });
  // Only text and labels are edited here. Status changes go through the action route so the flow is enforced.
  const patch: DraftInput = {};
  if (b.title !== undefined) patch.title = String(b.title).slice(0, 200);
  if (b.content !== undefined) patch.content = String(b.content).slice(0, 6000);
  if (b.thread !== undefined) patch.thread = Array.isArray(b.thread) ? b.thread.map(String).slice(0, 25) : [];
  if (b.pillar !== undefined) patch.pillar = b.pillar || null;
  if (b.platform === "x" || b.platform === "linkedin") patch.platform = b.platform;
  // Changing the text of a draft in review or approved sends it back to draft, so what was approved is what goes out. A save with no change does not.
  const changed = (patch.content !== undefined && patch.content !== cur.content) || (patch.thread !== undefined && JSON.stringify(patch.thread) !== JSON.stringify(cur.thread)) || (patch.platform !== undefined && patch.platform !== cur.platform);
  if (changed && (cur.status === "approved" || cur.status === "review")) patch.status = "draft";
  return NextResponse.json(await updateDraft(id, patch));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;
  await deleteDraft((await params).id);
  return NextResponse.json({ ok: true });
}
