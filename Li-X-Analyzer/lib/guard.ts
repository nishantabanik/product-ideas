import { NextResponse } from "next/server";
import { isAuthed } from "./auth";

export async function requireAuth() {
  return (await isAuthed()) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
