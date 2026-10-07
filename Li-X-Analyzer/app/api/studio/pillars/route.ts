import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { replacePillars } from "@/lib/studio/store";

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { pillars?: { id?: string; name?: string; keywords?: string[] | string }[] };
  const list = (b.pillars ?? []).map((p) => ({
    id: p.id, name: String(p.name ?? "").trim().slice(0, 60),
    keywords: (Array.isArray(p.keywords) ? p.keywords : String(p.keywords ?? "").split(",")).map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 40),
  })).filter((p) => p.name).slice(0, 12);
  await replacePillars(list);
  return NextResponse.json({ ok: true, count: list.length });
}
