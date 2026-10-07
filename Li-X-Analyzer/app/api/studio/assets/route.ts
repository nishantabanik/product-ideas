import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteAsset, saveAsset, setAssetActive } from "@/lib/studio/assets-store";

/** Create or change one item of our writing profile. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const id = await saveAsset((await req.json()) as Parameters<typeof saveAsset>[0]);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { id?: string; active?: boolean };
  if (!b.id || typeof b.active !== "boolean") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await setAssetActive(b.id, b.active);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = (await req.json()) as { id?: string };
  if (id) await deleteAsset(id);
  return NextResponse.json({ ok: true });
}
