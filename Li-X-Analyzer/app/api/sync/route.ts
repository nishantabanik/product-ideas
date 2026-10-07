import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { syncFromPostiz } from "@/lib/sync";

export const maxDuration = 60;

export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json(await syncFromPostiz(90, true));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
