import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { removeComment, setCommentUrl, setFollowUp, setStatus } from "@/lib/comments/store";

type Ctx = { params: Promise<{ id: string }> };

/** Any of: status, commentUrl, followUpAt (an ISO date, or null to clear the reminder). */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { status?: string; commentUrl?: string; followUpAt?: string | null };
  const { status, commentUrl } = b;
  if (commentUrl === undefined && status === undefined && b.followUpAt === undefined) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  if (commentUrl !== undefined && !/^https?:\/\//i.test(String(commentUrl).trim())) return NextResponse.json({ error: "That does not look like a link" }, { status: 400 });
  if (status !== undefined && status !== "new" && status !== "replied" && status !== "ignored") return NextResponse.json({ error: "Bad status" }, { status: 400 });
  let followUpAt: string | null | undefined;
  if (b.followUpAt !== undefined) {
    if (b.followUpAt === null) followUpAt = null;
    else if (typeof b.followUpAt === "string" && !Number.isNaN(Date.parse(b.followUpAt))) followUpAt = new Date(b.followUpAt).toISOString();
    else return NextResponse.json({ error: "That is not a date" }, { status: 400 });
  }
  if (commentUrl !== undefined) await setCommentUrl(id, String(commentUrl).trim());
  if (status !== undefined) await setStatus(id, status);
  if (followUpAt !== undefined) await setFollowUp(id, followUpAt);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;
  await removeComment((await params).id);
  return NextResponse.json({ ok: true });
}
