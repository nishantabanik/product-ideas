import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { applyAction } from "@/lib/studio/service";
import type { Action } from "@/lib/studio/flow";

export const maxDuration = 60;
const ACTIONS: Action[] = ["promote", "submit", "approve", "changes", "reopen", "schedule"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const b = (await req.json()) as { action?: Action; note?: string; date?: string; now?: boolean; channelId?: string };
  if (!b.action || !ACTIONS.includes(b.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  try {
    return NextResponse.json(await applyAction(id, b.action, b));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
