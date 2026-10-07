import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { startDeviceFlow } from "@/lib/llm/copilot";

export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return NextResponse.json(await startDeviceFlow());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
