export const maxDuration = 60;

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { llmText } from "@/lib/llm";
import { db, ensureSchema } from "@/lib/db";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { messages, model } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    await ensureSchema();
    const sql = db();

    // Get the latest X sync time and latest X data date from account_buckets/posts if available
    const [lastXSync] = await sql<{ captured_at: Date }[]>`select max(captured_at) as captured_at from account_buckets`;

    // Get the latest LinkedIn data date
    const [lastLiData] = await sql<{ day: Date }[]>`select max(day) as day from daily_metrics where platform = 'linkedin'`;

    // Also get latest post published dates to understand recency
    const [lastLiPost] = await sql<{ max_pub: Date }[]>`select max(published_at) as max_pub from posts where platform='linkedin'`;
    const [lastXPost] = await sql<{ max_pub: Date }[]>`select max(published_at) as max_pub from posts where platform='x'`;

    // Check if we have Postiz channels
    const [channels] = await sql<{ count: number }[]>`select count(*)::int as count from channels`;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const lastXSyncStr = lastXSync?.captured_at ? new Date(lastXSync.captured_at).toISOString() : "Never synced";
    const lastLiDataStr = lastLiData?.day ? new Date(lastLiData.day).toISOString().slice(0, 10) : "No data";
    const lastLiPostStr = lastLiPost?.max_pub ? new Date(lastLiPost.max_pub).toISOString().slice(0, 10) : "No posts";
    const lastXPostStr = lastXPost?.max_pub ? new Date(lastXPost.max_pub).toISOString().slice(0, 10) : "No posts";

    const daysBetween = (d1: string, d2: string) => {
      const a = new Date(d1 + "T00:00:00Z").getTime();
      const b = new Date(d2 + "T00:00:00Z").getTime();
      return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
    };

    const liMissing = lastLiDataStr !== "No data" ? daysBetween(lastLiDataStr, todayStr) : null;
    const xMissingByData = lastLiDataStr !== "No data" ? null : null; // not directly comparable; focus on sync
    const xDaysSinceSync = lastXSync?.captured_at ? daysBetween(lastXSync.captured_at.toISOString().slice(0, 10), todayStr) : null;

    const system = `You are an AI assistant built into the Li X Analyzer app to help the user understand their analytics and troubleshoot missing data.

RULES:
- Answer in plain English. Short sentences.
- Be honest. The app relies on Postiz for X data and Excel/CSV exports for LinkedIn.

IMPORTANT TROUBLESHOOTING KNOWLEDGE:
1. Missing LinkedIn Analytics: LinkedIn personal profiles do not have an open API for analytics. The user MUST go to LinkedIn, export their analytics as an Excel/CSV file, and upload it in the "Import data" tab (left menu). Uploading covers daily numbers and top posts; safe to repeat.
2. Missing X (Twitter) Analytics: X data comes from Postiz. The app syncs from Postiz automatically every day at 06:00 UTC. If they want to sync right now, you can trigger a sync by including the exact text \`[ACTION_REQUIRED: SYNC]\` in your response.
3. Missing LinkedIn Comments: The LinkedIn API does not allow reading comments for a personal profile automatically. The user MUST paste the comments in the "Comments" tab manually or use a file upload there (Add comments / upload file).
4. Missing X Comments: X replies are read automatically if the X keys are set in Settings/Vercel. A sync also refreshes data; if keys are missing, set them in Vercel/Settings.

CURRENT APP STATE (UTC):
- Today: ${todayStr}
- X data last synced: ${lastXSyncStr} (days since sync: ${xDaysSinceSync ?? "unknown"})
- Latest LinkedIn daily data: ${lastLiDataStr} (days missing vs today: ${liMissing ?? "unknown"})
- Latest LinkedIn post published: ${lastLiPostStr}
- Latest X post published: ${lastXPostStr}
- Connected Channels: ${channels?.count || 0}

DIAGNOSIS GUIDANCE:
- If user says "LinkedIn analytics not showing till today / last 7 days missing": explain LinkedIn has no public API; data comes only from uploaded exports. Tell them to export from LinkedIn (Analytics > select range) and upload via "Import data" (/import). If they uploaded recently, LinkedIn export may lag; upload again or export shorter ranges. Be explicit about which dates are missing.
- If user says "X not showing recent days": explain X comes from Postiz; if last sync is old, trigger sync with \`[ACTION_REQUIRED: SYNC]\`. Also note cron runs 06:00 UTC; manual sync helps now.
- If user asks to "resolve it": for LinkedIn you CANNOT auto-import (must upload export). Give exact steps: open /import, choose LinkedIn export file, upload. For X, if Postiz connected, include \`[ACTION_REQUIRED: SYNC]\` and say syncing now. For comments: LinkedIn -> manual paste/upload in Comments; X -> needs keys + sync.

RESPONSE REQUIREMENTS:
- Always give a clear reason (why) and exact resolution steps.
- If resolution is possible via app action, do it by including the marker.
- Be concrete with dates (today=${todayStr}, last available=${lastLiDataStr}).

If the user complains about missing data for LinkedIn, explicitly tell them to use the "Import data" page to upload their LinkedIn export file. If they complain about missing X data and want it resolved now, output \`[ACTION_REQUIRED: SYNC]\` in your reply to automatically trigger a sync for them.

Remember: KEEP IT SHORT, clear, and actionable.`;

    const userMsg = messages[messages.length - 1].content;
    const history = messages.slice(-8, -1).map((m: { role: string; content: string }) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`).join("\n");
    const userPrompt = `${history}\n\nUser: ${userMsg}`;

    const r = await llmText({
      system,
      user: userPrompt,
      maxTokens: 500,
      model: model || undefined,
      provider: model ? (model.startsWith("copilot::") ? "copilot" : "gateway") : undefined,
    });

    return NextResponse.json({ reply: r.text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
