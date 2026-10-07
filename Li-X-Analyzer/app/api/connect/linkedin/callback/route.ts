import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { saveConnection } from "@/lib/connections";
import { exchangeCode } from "@/lib/comments/linkedin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/settings?${q}`, url));
  if (!(await isAuthed())) return NextResponse.redirect(new URL("/login", url));
  const cookie = req.headers.get("cookie")?.match(/lix_li_state=([a-f0-9]+)/)?.[1];
  if (url.searchParams.get("error")) return back(`linkedin=denied`);
  if (!cookie || cookie !== url.searchParams.get("state")) return back("linkedin=state");
  try {
    await saveConnection("linkedin", await exchangeCode(url.searchParams.get("code") ?? "", url.origin));
    const res = back("linkedin=connected");
    res.cookies.delete({ name: "lix_li_state", path: "/api/connect/linkedin" });
    return res;
  } catch (e) {
    return back(`linkedin=error&msg=${encodeURIComponent((e as Error).message.slice(0, 200))}`);
  }
}
