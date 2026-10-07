import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteFollowerDay, saveFollowerDay } from "@/lib/insights/followers-store";
import { isDay } from "@/lib/ranges";

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as { platform?: string; day?: string; total?: unknown } | null;
  if (!b || (b.platform !== "linkedin" && b.platform !== "x")) return bad("Choose LinkedIn or X.");
  if (!isDay(b.day)) return bad("Use a date like 2026-10-05.");
  if (b.day > new Date().toISOString().slice(0, 10)) return bad("That date is in the future.");
  const total = Number(b.total);
  if (b.total === "" || b.total === null || !Number.isInteger(total) || total < 0 || total > 1_000_000_000) return bad("Total followers must be a whole number, zero or more.");
  try {
    await saveFollowerDay(b.platform, b.day, total);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const url = new URL(req.url);
  const b = (await req.json().catch(() => ({}))) as { platform?: string; day?: string };
  const platform = b.platform ?? url.searchParams.get("platform");
  const day = b.day ?? url.searchParams.get("day") ?? undefined;
  if (platform !== "linkedin" && platform !== "x") return bad("Choose LinkedIn or X.");
  if (!isDay(day)) return bad("Use a date like 2026-10-05.");
  try {
    await deleteFollowerDay(platform, day);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
