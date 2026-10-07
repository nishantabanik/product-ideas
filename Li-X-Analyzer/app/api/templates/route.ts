import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { bumpTemplate, deleteTemplate, listTemplates, saveTemplate } from "@/lib/comments/template-store";
import { STARTER_TEMPLATES } from "@/lib/comments/starters";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const saved = await listTemplates();
    return NextResponse.json({ templates: saved.length ? saved : STARTER_TEMPLATES, builtin: saved.length === 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Creates a template, updates one when an id is given, or with use: true counts one use. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as { id?: string; name?: string; body?: string; platform?: string; use?: boolean };
  try {
    if (b.use) {
      if (!b.id) return NextResponse.json({ error: "Which template?" }, { status: 400 });
      await bumpTemplate(b.id);
      return NextResponse.json({ ok: true });
    }
    const name = (b.name ?? "").trim().slice(0, 80);
    const body = (b.body ?? "").trim().slice(0, 2000);
    const platform = b.platform === "linkedin" || b.platform === "x" ? b.platform : "both";
    if (!name) return NextResponse.json({ error: "Give the template a name." }, { status: 400 });
    if (!body) return NextResponse.json({ error: "Write the text of the template." }, { status: 400 });
    const id = await saveTemplate({ id: b.id && !b.id.startsWith("starter-") ? b.id : null, name, body, platform });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") ?? ((await req.json().catch(() => ({}))) as { id?: string }).id;
  if (!id) return NextResponse.json({ error: "Which template?" }, { status: 400 });
  try {
    await deleteTemplate(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
