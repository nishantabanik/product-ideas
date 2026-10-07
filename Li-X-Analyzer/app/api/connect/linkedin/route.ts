import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deleteConnection } from "@/lib/connections";
import { requireAuth } from "@/lib/guard";
import { authorizeUrl, linkedinOAuthConfigured } from "@/lib/comments/linkedin";

/** Starts the LinkedIn sign in. The state value goes into a cookie and must come back unchanged. */
export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.redirect(new URL("/login", req.url));
  if (!linkedinOAuthConfigured()) return NextResponse.redirect(new URL("/settings?linkedin=notconfigured", req.url));
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(new URL(req.url).origin, state));
  res.cookies.set("lix_li_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/connect/linkedin", maxAge: 600 });
  return res;
}

export async function DELETE() {
  const denied = await requireAuth();
  if (denied) return denied;
  await deleteConnection("linkedin");
  return NextResponse.json({ ok: true });
}
