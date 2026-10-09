export const maxDuration = 60;

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { llmAvailable, llmText } from "@/lib/llm";
import { parseChoice } from "@/lib/llm/choice";
import { db, ensureSchema } from "@/lib/db";
import { counts as commentCounts, type Counts } from "@/lib/comments/store";
import { xConfigured } from "@/lib/comments/x";
import { getConnection } from "@/lib/connections";
import type { LinkedinConn } from "@/lib/comments/linkedin";

const ACTION_SYNC = "[ACTION: SYNC]";
const ACTION_X_REPLIES = "[ACTION: X_REPLIES]";
const ACTION_ADVISORY = "[ACTION: ADVISORY]";

/** The global side advisor: one chat everywhere, answers about the current page and can run a resolution when one exists. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  let body: { messages?: unknown; model?: string; page?: string };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  if (!(await llmAvailable())) return NextResponse.json({ error: "No model is connected. Open Settings, add a gateway URL and key, or sign in with GitHub Copilot." }, { status: 400 });

  const diag = await gatherDiagnostics();
  const page = (body.page ?? "general").toLowerCase();
  const system = buildSystem(diag, page);

  const userMsg = String(messages[messages.length - 1]?.content ?? "").trim();
  const history = messages.slice(-8, -1).map((m) => `${m?.role === "assistant" ? "Assistant" : "User"}: ${String(m?.content ?? "")}`).join("\n");
  const userPrompt = history ? `${history}\n\nUser: ${userMsg}` : userMsg;

  const pick = parseChoice(body.model);
  try {
    const r = await llmText({ system, user: userPrompt, maxTokens: 700, model: pick.model, provider: pick.provider });
    const { text, action } = extractAction(r.text);
    return NextResponse.json({ reply: text, action });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

/** Pulls the one marker the model may have added and turns it into a client action. */
function extractAction(text: string): { text: string; action: string | null } {
  let action: string | null = null;
  let out = text;
  const markers: [string, string][] = [
    [ACTION_SYNC, "sync"],
    [ACTION_X_REPLIES, "x-replies"],
    [ACTION_ADVISORY, "advisory"],
  ];
  for (const [marker, name] of markers) {
    if (out.includes(marker)) {
      if (!action) action = name;
      out = out.split(marker).join("");
    }
  }
  return { text: out.replace(/\n{3,}/g, "\n\n").trim(), action };
}

type Diagnostics = {
  today: string;
  lastXSync: string | null;
  xDaysSinceSync: number | null;
  lastLiData: string | null;
  liDaysMissing: number | null;
  lastLiPost: string | null;
  lastXPost: string | null;
  channels: number;
  lastAdvisory: string | null;
  comments: Counts | null;
  xReady: boolean;
  liConnected: boolean;
};

const daysBetween = (a: string, b: string) => {
  const x = new Date(`${a}T00:00:00Z`).getTime();
  const y = new Date(`${b}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((y - x) / 86_400_000));
};

async function gatherDiagnostics(): Promise<Diagnostics> {
  await ensureSchema();
  const sql = db();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let lastXSync: string | null = null;
  let lastLiData: string | null = null;
  let lastLiPost: string | null = null;
  let lastXPost: string | null = null;
  let channels = 0;
  let lastAdvisory: string | null = null;
  let comments: Counts | null = null;

  try { const [r] = await sql<{ captured_at: Date | null }[]>`select max(captured_at) as captured_at from account_buckets`; lastXSync = r?.captured_at ? new Date(r.captured_at).toISOString().slice(0, 10) : null; } catch { /* keep null */ }
  try { const [r] = await sql<{ day: Date | null }[]>`select max(day) as day from daily_metrics where platform = 'linkedin'`; lastLiData = r?.day ? new Date(r.day).toISOString().slice(0, 10) : null; } catch { /* keep null */ }
  try { const [r] = await sql<{ d: Date | null }[]>`select max(published_at) as d from posts where platform = 'linkedin'`; lastLiPost = r?.d ? new Date(r.d).toISOString().slice(0, 10) : null; } catch { /* keep null */ }
  try { const [r] = await sql<{ d: Date | null }[]>`select max(published_at) as d from posts where platform = 'x'`; lastXPost = r?.d ? new Date(r.d).toISOString().slice(0, 10) : null; } catch { /* keep null */ }
  try { const [r] = await sql<{ n: number }[]>`select count(*)::int as n from channels`; channels = r?.n ?? 0; } catch { /* keep 0 */ }
  try { const [r] = await sql<{ day: Date | null }[]>`select max(day) as day from advisories`; lastAdvisory = r?.day ? new Date(r.day).toISOString().slice(0, 10) : null; } catch { /* keep null */ }
  try { comments = await commentCounts(); } catch { /* keep null */ }

  const xReady = xConfigured();
  let liConnected = false;
  try { const li = await getConnection<LinkedinConn>("linkedin"); liConnected = !!li && li.expiresAt > Date.now() / 1000; } catch { /* keep false */ }

  return {
    today: todayStr,
    lastXSync,
    xDaysSinceSync: lastXSync ? daysBetween(lastXSync, todayStr) : null,
    lastLiData,
    liDaysMissing: lastLiData ? daysBetween(lastLiData, todayStr) : null,
    lastLiPost,
    lastXPost,
    channels,
    lastAdvisory,
    comments,
    xReady,
    liConnected,
  };
}

function buildSystem(d: Diagnostics, page: string): string {
  const state = [
    `Today is ${d.today} (UTC).`,
    d.lastLiData ? `Latest LinkedIn daily data is from ${d.lastLiData} (${d.liDaysMissing ?? 0} days before today).` : "There is no LinkedIn daily data yet.",
    d.lastXSync ? `X data was last synced from Postiz on ${d.lastXSync} (${d.xDaysSinceSync ?? 0} days ago).` : "X has never been synced from Postiz.",
    d.lastLiPost ? `Latest LinkedIn post is from ${d.lastLiPost}.` : "No LinkedIn posts recorded.",
    d.lastXPost ? `Latest X post is from ${d.lastXPost}.` : "No X posts recorded.",
    `${d.channels} Postiz channel${d.channels === 1 ? "" : "s"} connected.`,
    d.lastAdvisory ? `Latest Advisory is for ${d.lastAdvisory}.` : "No Advisory generated yet.",
    d.xReady ? "X keys are set, so X replies can be read." : "X keys are NOT set, so X replies cannot be read yet.",
    d.liConnected ? "LinkedIn is connected for sending replies." : "LinkedIn is not connected for sending replies.",
  ].join("\n");

  const counts = d.comments
    ? `Comments now: ${d.comments.new} need a reply, ${d.comments.replied} replied, ${d.comments.ignored} ignored, ${d.comments.followUp} to follow up.`
    : "Comment counts are not available yet.";

  const pageGuide: Record<string, string> = {
    analytics: "We are on the Analytics page. Questions are usually about missing recent data, ranges, top posts, benchmarks, content, goals, growth or reports.",
    advisory: "We are on the Advisory page. Questions are usually about the daily review, health scores, findings, the post audit, coach notes or regenerating today's Advisory.",
    studio: "We are on the Studio page. Questions are usually about writing drafts, story formats, My style, the board, approval, the thread builder or the writing assistant.",
    comments: "We are on the Comments page. Questions are usually about reading and replying to X and LinkedIn comments, direct messages, templates or follow ups.",
    leads: "We are on the Leads page. Questions are usually about the lead pipeline and its stages.",
    targets: "We are on the Targets page. Questions are usually about the target list, daily engagement and streaks.",
    queue: "We are on the Queue page. Questions are usually about best times, weekly slots, filling the queue and running old winners again.",
    calendar: "We are on the Calendar page. Questions are usually about scheduled and published posts.",
    schedule: "We are on the Compose or Bulk schedule page. Questions are usually about scheduling one or many posts.",
    import: "We are on the Import data page. Questions are usually about uploading LinkedIn or X exports.",
    general: "We are on a general page. Answer broadly about the app.",
  };

  return `You are the side advisor inside Li X Analyzer, an app to plan, write, schedule and measure LinkedIn and X posts.

Be honest and concise. Plain English, short sentences. Never invent numbers. Prefer a definite reason and exact steps over a guess.

THE DATA REALITY:
- LinkedIn analytics have no open API for personal profiles. LinkedIn numbers come only from Excel/CSV exports uploaded on the Import data page (/import). The app cannot fetch them automatically.
- X numbers come from Postiz. The app syncs from Postiz automatically every day at 06:00 UTC, and can sync right now.
- LinkedIn comments on a personal profile cannot be read by any app. They are added by pasting or uploading a file on the Comments page.
- X replies are read automatically only when the four X keys are set, and only new replies are fetched (X bills per tweet read).

CURRENT APP STATE:
${state}
${counts}

${pageGuide[page] ?? pageGuide.general}

HOW TO RESOLVE WHEN POSSIBLE:
- To refresh X data now, include exactly ${ACTION_SYNC} in your answer and tell them you are syncing with Postiz now.
- To check X for new replies now, include exactly ${ACTION_X_REPLIES}.
- To regenerate today's Advisory now, include exactly ${ACTION_ADVISORY}.
- When something CANNOT be fixed automatically (for example LinkedIn data or LinkedIn comments), say so plainly, give the exact reason, and give the step by step fix. Do not include an action marker.

RULES:
- If the answer needs an action you can run, include exactly one action marker.
- Keep it short and actionable. End with the concrete next step.`;
}
