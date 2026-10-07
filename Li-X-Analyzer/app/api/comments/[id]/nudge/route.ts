import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { llmAvailable } from "@/lib/llm";
import { getComment } from "@/lib/comments/store";
import { fallbackNudges, suggestNudges } from "@/lib/comments/suggest";

export const maxDuration = 120;
type Ctx = { params: Promise<{ id: string }> };

/** Three follow up lines for a conversation that went quiet. Without a model, three fixed neutral lines. */
export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const c = await getComment((await params).id);
  if (!c) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  const { days } = (await req.json().catch(() => ({}))) as { days?: number };
  if (!(await llmAvailable())) return NextResponse.json({ lines: fallbackNudges(c.platform), method: "fixed" });
  try {
    const lines = await suggestNudges({ platform: c.platform, kind: c.kind, author: c.authorName, theirMessage: c.body, ourReply: c.replyText, days: Math.max(1, Math.round(days || 3)) });
    return NextResponse.json({ lines, method: "model" });
  } catch {
    return NextResponse.json({ lines: fallbackNudges(c.platform), method: "fixed" });
  }
}
