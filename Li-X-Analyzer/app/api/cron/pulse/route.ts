import { NextResponse } from "next/server";
import { runPulse } from "@/lib/pulse/service";

export const maxDuration = 60;

/** Called every 15 minutes by the GitHub workflow (or any scheduler) with the CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runPulse());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
