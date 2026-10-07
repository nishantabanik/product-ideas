import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { fillQueue } from "@/lib/studio/service";

export const maxDuration = 120;

export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json(await fillQueue());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
