import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { createLead, createMany, leadFromComment } from "@/lib/leads/store";
import { parseLeadInput } from "@/lib/leads/input";
import { isSource, parsePeople } from "@/lib/leads/stages";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  let b: Record<string, unknown>;
  try { b = (await req.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.commentId !== undefined) {
      if (typeof b.commentId !== "string" || !b.commentId.trim() || b.commentId.length > 200) return NextResponse.json({ error: "Bad comment" }, { status: 400 });
      const r = await leadFromComment(b.commentId.trim());
      if (!r) return NextResponse.json({ error: "We could not find that comment" }, { status: 404 });
      return NextResponse.json(r.existing ? { id: r.id, existing: true } : { id: r.id });
    }
    if (b.paste !== undefined) {
      if (b.platform !== "linkedin" && b.platform !== "x") return NextResponse.json({ error: "Choose LinkedIn or X" }, { status: 400 });
      const people = typeof b.paste === "string" ? parsePeople(b.paste) : [];
      if (!people.length) return NextResponse.json({ error: "Paste at least one name" }, { status: 400 });
      const source = isSource(b.source) ? b.source : "profile_view";
      const added = await createMany(people, b.platform, source);
      return NextResponse.json({ ok: true, added, skipped: people.length - added });
    }
    const p = parseLeadInput(b);
    if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
    return NextResponse.json({ id: await createLead(p.value) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
