import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { refreshOld } from "@/lib/studio/ai";
import { createDraft, postFacts } from "@/lib/studio/store";

export const maxDuration = 90;

/** Turns an old winner into a new draft, with a fresh opening when a model is connected. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { postId, refresh } = (await req.json()) as { postId?: string; refresh?: boolean };
  const posts = await postFacts(2000);
  const old = posts.find((p) => p.id === postId);
  if (!old) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  let content = old.content.trim();
  let note: string | null = null;
  if (refresh) {
    try { content = await refreshOld({ platform: old.platform, text: content, posts }); } catch (e) { note = `Kept the original wording: ${(e as Error).message}`; }
  }
  const d = await createDraft({ platform: old.platform, status: "draft", title: `Again: ${old.content.trim().split("\n")[0].slice(0, 70)}`, content, source: "recycle", parentPostId: old.id });
  return NextResponse.json({ id: d.id, note });
}
