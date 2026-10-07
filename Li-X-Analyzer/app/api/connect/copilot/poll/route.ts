import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { dbStore, pollDeviceFlow } from "@/lib/llm/copilot";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { deviceCode } = (await req.json()) as { deviceCode?: string };
  if (!deviceCode) return NextResponse.json({ error: "Missing device code" }, { status: 400 });
  try {
    return NextResponse.json(await pollDeviceFlow(deviceCode, await dbStore()));
  } catch (e) {
    return NextResponse.json({ status: "error", message: (e as Error).message }, { status: 502 });
  }
}
