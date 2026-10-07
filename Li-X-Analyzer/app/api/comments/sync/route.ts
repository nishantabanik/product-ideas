import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { syncXComments } from "@/lib/comments/service";

export const maxDuration = 60;

export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, ...(await syncXComments()) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
