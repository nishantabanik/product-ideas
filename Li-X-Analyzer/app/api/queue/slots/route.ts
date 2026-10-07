import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { validTime, validZone } from "@/lib/studio/slots";
import { replaceSlots, setZone } from "@/lib/studio/store";

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { platform?: string; slots?: { weekday: number; time: string }[]; tz?: string };
  if (b.platform !== "x" && b.platform !== "linkedin") return NextResponse.json({ error: "Choose X or LinkedIn." }, { status: 400 });
  if (b.tz) { if (!validZone(b.tz)) return NextResponse.json({ error: "Unknown time zone." }, { status: 400 }); await setZone(b.tz); }
  const slots = (b.slots ?? []).filter((s) => Number.isInteger(s.weekday) && s.weekday >= 0 && s.weekday <= 6 && validTime(s.time)).slice(0, 70);
  await replaceSlots(b.platform, slots);
  return NextResponse.json({ ok: true, count: slots.length });
}
