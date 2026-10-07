import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { parseBulkRows } from "@/lib/bulk";
import { readSheets } from "@/lib/read-sheet";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  let sheets: { rows: unknown[][] }[];
  try {
    sheets = await readSheets(file);
  } catch {
    return NextResponse.json({ error: "Could not read that file. Use .xlsx or .csv." }, { status: 400 });
  }
  const first = sheets.find((s) => s.rows.some((r) => r.some((c) => String(c ?? "").trim())))?.rows ?? [];
  const parsed = parseBulkRows(first);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });
  return NextResponse.json({ rows: parsed.rows });
}
