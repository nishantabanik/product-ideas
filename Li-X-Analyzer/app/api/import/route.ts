import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { parseWorkbook } from "@/lib/import-parse";
import { storeImport } from "@/lib/import-store";
import { readSheets } from "@/lib/read-sheet";

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  let parsed;
  try {
    parsed = parseWorkbook(await readSheets(file));
  } catch {
    return NextResponse.json({ error: "Could not read that file. Use the .xlsx or .csv export from LinkedIn or X." }, { status: 400 });
  }
  if (!parsed.daily.length && !parsed.posts.length && !parsed.followers.length) {
    return NextResponse.json(
      { error: "Nothing recognisable in that file. We look for a Date column with Impressions or Engagements, for tables with a Post URL column, and for follower sheets (Date with New followers or Total followers)." },
      { status: 422 },
    );
  }

  try {
    return NextResponse.json({ file: file.name, ...(await storeImport(parsed)) });
  } catch (e) {
    return NextResponse.json({ error: `Could not save: ${(e as Error).message}` }, { status: 500 });
  }
}
