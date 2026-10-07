import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { capture, type CaptureInput } from "@/lib/comments/service";

export const maxDuration = 120;

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as Partial<CaptureInput>;
  if (b.platform !== "x" && b.platform !== "linkedin") return NextResponse.json({ error: "Choose LinkedIn or X" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await capture({ kind: b.kind === "dm" ? "dm" : "comment", platform: b.platform, post: b.post, mode: b.mode === "single" ? "single" : "paste", text: b.text, smart: b.smart, author: b.author, body: b.body, link: b.link })) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
