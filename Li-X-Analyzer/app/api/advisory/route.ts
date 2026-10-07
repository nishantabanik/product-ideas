import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { coachConfigured } from "@/lib/advisory/coach";
import { generateAdvisory } from "@/lib/advisory/generate";
import { getAdvisory } from "@/lib/advisory/store";

export const maxDuration = 300;

/** Rebuild today's advisory now. Asks Claude for coach notes too when a key is set. */
export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, coachConfigured: await coachConfigured(), ...(await generateAdvisory({ withCoach: true })) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const day = new URL(req.url).searchParams.get("day") ?? undefined;
  const found = await getAdvisory(day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined);
  return found ? NextResponse.json(found) : NextResponse.json({ error: "No advisory yet" }, { status: 404 });
}
