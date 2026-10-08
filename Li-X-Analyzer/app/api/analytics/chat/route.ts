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

    // Get the latest X sync time
    const [lastXSync] = await sql<{ captured_at: Date }[]>`select max(captured_at) as captured_at from account_buckets`;

    // Get the latest LinkedIn data date
    const [lastLiData] = await sql<{ day: Date }[]>`select max(day) as day from daily_metrics where platform = 'linkedin'`;

    // Check if we have Postiz channels
    const [channels] = await sql<{ count: number }[]>`select count(*)::int as count from channels`;

    const lastXSyncStr = lastXSync?.captured_at ? new Date(lastXSync.captured_at).toISOString() : "Never synced";
    const lastLiDataStr = lastLiData?.day ? new Date(lastLiData.day).toISOString().slice(0, 10) : "No data";

    const system = `You are an AI assistant built into the Li X Analyzer app to help the user understand their analytics and troubleshoot missing data.

RULES:
- Answer in plain English. Short sentences.
- Be honest. The app relies on Postiz for X data and Excel/CSV exports for LinkedIn.

IMPORTANT TROUBLESHOOTING KNOWLEDGE:
1. Missing LinkedIn Analytics: LinkedIn personal profiles do not have an open API for analytics. The user MUST go to LinkedIn, export their analytics as an Excel/CSV file, and upload it in the "Import data" tab (left menu).
2. Missing X (Twitter) Analytics: X data comes from Postiz. The app syncs from Postiz automatically every day at 06:00 UTC. If they want to sync right now, you can trigger a sync by including the exact text \`[ACTION_REQUIRED: SYNC]\` in your response.
3. Missing LinkedIn Comments: The LinkedIn API does not allow reading comments for a personal profile automatically. The user MUST paste the comments in the "Comments" tab manually or use a file upload there.
4. Missing X Comments: X replies are read automatically if the X keys are set in Settings/Vercel.

CURRENT APP STATE:
- X data last synced: ${lastXSyncStr}
- Latest LinkedIn data available: ${lastLiDataStr}
- Connected Channels: ${channels?.count || 0}

If the user complains about missing data for LinkedIn, explicitly tell them to use the "Import data" page to upload their LinkedIn export file. If they complain about missing X data, output \`[ACTION_REQUIRED: SYNC]\` in your reply to automatically trigger a sync for them, and tell them you are syncing the data right now.

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
