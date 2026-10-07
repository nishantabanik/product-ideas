import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { setRequireApproval } from "@/lib/studio/store";

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { requireApproval?: boolean };
  await setRequireApproval(Boolean(b.requireApproval));
  return NextResponse.json({ ok: true });
}
