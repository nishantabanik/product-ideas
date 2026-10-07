import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { createMany, createTarget, MAX_TARGETS, type TargetInput } from "@/lib/targets/store";
import { parseTargetInput } from "@/lib/targets/input";
import { parseTargets } from "@/lib/targets/rotation";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  let b: Record<string, unknown>;
  try { b = (await req.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if (b.paste !== undefined) {
      if (b.platform !== "linkedin" && b.platform !== "x") return NextResponse.json({ error: "Choose LinkedIn or X" }, { status: 400 });
      const list = typeof b.paste === "string" ? parseTargets(b.paste) : [];
      if (!list.length) return NextResponse.json({ error: "Paste at least one name" }, { status: 400 });
      const r = await createMany(list, b.platform);
      if (!r.added && list.length) return NextResponse.json({ error: `Nothing added. Either they are already on the list or we are at the limit of ${MAX_TARGETS}.` }, { status: 400 });
      return NextResponse.json({ ok: true, ...r });
    }
    const p = parseTargetInput(b);
    if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
    const id = await createTarget(p.value as unknown as TargetInput);
    if (!id) return NextResponse.json({ error: `We keep the list to ${MAX_TARGETS} people. Remove someone first.` }, { status: 400 });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
