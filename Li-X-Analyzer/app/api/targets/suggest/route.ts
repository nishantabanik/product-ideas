import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { suggestComments } from "@/lib/targets/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const post = typeof b.post === "string" ? b.post.trim() : "";
  if (!post) return NextResponse.json({ error: "Paste the text of their latest post first" }, { status: 400 });
  if (b.platform !== "linkedin" && b.platform !== "x") return NextResponse.json({ error: "Choose LinkedIn or X" }, { status: 400 });
  try {
    return NextResponse.json(await suggestComments({ platform: b.platform, name: typeof b.name === "string" ? b.name.slice(0, 120) : "this person", topics: typeof b.topics === "string" ? b.topics.slice(0, 300) : "", post }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
