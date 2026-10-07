import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { markAllSeen } from "@/lib/pulse/store";
import { runPulse } from "@/lib/pulse/service";

export const maxDuration = 60;

/** Check recent posts right now. */
export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json(await runPulse());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function PATCH() {
  const denied = await requireAuth();
  if (denied) return denied;
  await markAllSeen();
  return NextResponse.json({ ok: true });
}
