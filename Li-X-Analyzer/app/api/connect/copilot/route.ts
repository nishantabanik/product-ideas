import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteConnection } from "@/lib/connections";

export async function DELETE() {
  const denied = await requireAuth();
  if (denied) return denied;
  await deleteConnection("copilot");
  return NextResponse.json({ ok: true });
}
