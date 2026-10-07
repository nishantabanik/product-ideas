import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { listChannels } from "@/lib/postiz";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const channels = (await listChannels()).filter((c) => !c.disabled);
    return NextResponse.json(channels);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
