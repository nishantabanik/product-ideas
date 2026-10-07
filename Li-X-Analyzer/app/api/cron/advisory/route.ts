import { NextResponse } from "next/server";
import { generateAdvisory } from "@/lib/advisory/generate";

export const maxDuration = 300;

/** Runs every morning from the Vercel cron, a little after the Postiz sync. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await generateAdvisory({ withCoach: true }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
