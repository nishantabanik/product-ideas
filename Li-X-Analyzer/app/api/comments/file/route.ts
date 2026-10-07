import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { captureRows } from "@/lib/comments/service";
import { readSheets } from "@/lib/read-sheet";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const form = await req.formData();
  const file = form.get("file");
  const platform = form.get("platform");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (platform !== "x" && platform !== "linkedin") return NextResponse.json({ error: "Choose LinkedIn or X" }, { status: 400 });
  try {
    const sheets = await readSheets(file);
    const first = sheets.find((s) => s.rows.some((r) => r.some((c) => String(c ?? "").trim()))) ?? { rows: [] };
    return NextResponse.json({ ok: true, ...(await captureRows(platform, String(form.get("post") ?? "") || null, first.rows)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
