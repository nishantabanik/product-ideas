import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { getComment, markReplied } from "@/lib/comments/store";
import { sendReply } from "@/lib/comments/service";

type Ctx = { params: Promise<{ id: string }> };

/** send: true tries to post the reply from here. send: false only records that we answered it ourselves. */
export async function POST(req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const { text, send } = (await req.json()) as { text?: string; send?: boolean };
  const reply = (text ?? "").trim();
  if (!reply) return NextResponse.json({ error: "Write the reply first." }, { status: 400 });
  const c = await getComment(id);
  if (!c) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (c.platform === "x" && reply.length > 280) return NextResponse.json({ error: `X allows 280 characters, this has ${reply.length}.` }, { status: 400 });
  try {
    if (!send) { await markReplied(id, reply, "manual"); return NextResponse.json({ ok: true, sent: false, via: "manual" }); }
    return NextResponse.json({ ok: true, ...(await sendReply(c, reply)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
