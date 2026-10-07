import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { validateGoal } from "@/lib/insights/goals";
import { addGoal, deleteGoal, listGoals } from "@/lib/insights/goals-store";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Send the goal as JSON." }, { status: 400 });
  try {
    const v = validateGoal(body, (await listGoals()).length);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    return NextResponse.json({ id: await addGoal(v.goal) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing goal id." }, { status: 400 });
  try {
    await deleteGoal(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
