import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { createDraft, type DraftInput } from "@/lib/studio/store";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as DraftInput;
  if (b.platform !== "x" && b.platform !== "linkedin") return NextResponse.json({ error: "Choose X or LinkedIn." }, { status: 400 });
  const status = b.status === "idea" ? "idea" : "draft";
  const d = await createDraft({ platform: b.platform, status, title: (b.title ?? "").slice(0, 200), content: (b.content ?? "").slice(0, 6000), thread: Array.isArray(b.thread) ? b.thread.map(String).slice(0, 25) : [], pillar: b.pillar ?? null, source: b.source ?? "manual", parentId: b.parentId ?? null, parentPostId: b.parentPostId ?? null });
  return NextResponse.json(d);
}
