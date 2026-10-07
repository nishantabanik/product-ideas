import { NextResponse } from "next/server";
import { xConfigured } from "@/lib/comments/x";
import { syncXComments } from "@/lib/comments/service";
import { runScheduledReports } from "@/lib/reports/schedule";
import { runPulse } from "@/lib/pulse/service";
import { syncFromPostiz } from "@/lib/sync";

export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncFromPostiz();
    // New replies on X come in the same morning run. A problem here never loses the Postiz sync.
    let comments: { fetched: number; added: number } | { error: string } | null = null;
    if (xConfigured()) {
      try { comments = await syncXComments(); } catch (e) { comments = { error: (e as Error).message }; }
    }
    // The weekly or monthly report goes out when it is due, and fresh posts get one more look. Neither can break the sync.
    const reports = await runScheduledReports().catch((e) => [`error: ${(e as Error).message}`]);
    const pulse = await runPulse().catch((e) => ({ error: (e as Error).message }));
    return NextResponse.json({ ...result, comments, reports, pulse });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
