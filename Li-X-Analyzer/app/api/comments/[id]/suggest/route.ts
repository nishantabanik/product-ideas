import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { getComment } from "@/lib/comments/store";
import { suggestReplies } from "@/lib/comments/suggest";

export const maxDuration = 120;
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const c = await getComment((await params).id);
  if (!c) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  try {
    return NextResponse.json({ replies: await suggestReplies({ platform: c.platform, comment: c.body, author: c.authorName, postText: c.postContent, kind: c.kind }) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
