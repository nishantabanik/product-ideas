import { db, ensureSchema } from "../db";
import { dailyBuckets, topPosts } from "../analytics-data";
import { loadGoalProgress, type GoalView } from "../insights/goals-load";
import { latestTotal, netSeries, sumNet } from "../insights/followers";
import { loadFollowerRows } from "../insights/followers-store";
import { buildReport, reportPeriod, type DayPoint, type Freq, type FollowerInfo, type Report, type ReportInput, type ReportPost, type XWeek } from "./report";

const asPoints = (rows: Awaited<ReturnType<typeof dailyBuckets>>): DayPoint[] =>
  rows.map((r) => (r.days > 0 ? { day: r.start, impressions: r.impressions, engagements: r.engagements } : { day: r.start, impressions: null, engagements: null }));

/** X has only weekly account totals from Postiz, newest week first, counted back from the last refresh. We never turn them into days. */
async function loadX(): Promise<ReportInput["x"]> {
  await ensureSchema();
  const rows = await db()<(XWeek & { week: number; captured: Date })[]>`
    select ab.week, sum(ab.impressions)::int as impressions, sum(ab.likes)::int as likes, sum(ab.comments)::int as comments, sum(ab.shares)::int as shares, max(ab.captured_at) as captured
    from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week order by ab.week`;
  if (!rows.length) return null;
  const weeks: XWeek[] = [];
  for (const r of rows) {
    if (r.week !== weeks.length + 1) break; // stop at a gap instead of treating a missing week as zero
    weeks.push({ impressions: r.impressions, likes: r.likes, comments: r.comments, shares: r.shares });
  }
  return { weeks, capturedAt: rows[0].captured ? new Date(rows[0].captured).toISOString() : null };
}

async function loadFollowers(period: ReportInput["period"]): Promise<FollowerInfo[]> {
  const out: FollowerInfo[] = [];
  for (const platform of ["linkedin", "x"] as const) {
    const rows = await loadFollowerRows(platform);
    if (!rows.length) continue;
    const { days } = netSeries(rows);
    const cur = sumNet(days, period.from, period.to), prev = sumNet(days, period.prevFrom, period.prevTo);
    const t = latestTotal(rows.filter((r) => r.day <= period.to));
    out.push({ platform, total: t ? t.total : null, change: cur.days ? cur.sum : null, previousChange: prev.days ? prev.sum : null, days: cur.days });
  }
  return out;
}

export async function loadReportInput(freq: Freq, now: Date = new Date()): Promise<ReportInput> {
  const period = reportPeriod(freq, now);
  await ensureSchema();
  const [cur, prev, x, liPosts, xPosts, followers] = await Promise.all([
    dailyBuckets("linkedin", period.from, period.to, "day"),
    dailyBuckets("linkedin", period.prevFrom, period.prevTo, "day"),
    loadX(),
    topPosts("linkedin", period.from, period.to, 3),
    topPosts("x", period.from, period.to, 3),
    loadFollowers(period),
  ]);
  const top: ReportPost[] = [...liPosts, ...xPosts]
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 3)
    .map((p) => ({ id: p.id, platform: p.platform === "x" ? "x" : "linkedin", content: p.content, publishedAt: p.published_at ? new Date(p.published_at).toISOString() : null, impressions: p.impressions, engagements: p.engagements, url: p.url }));

  let goals: GoalView[] = [];
  try { goals = await loadGoalProgress(now); } catch { goals = []; }
  let pendingComments: number | null = null;
  try {
    const [r] = await db()<{ n: number }[]>`select count(*)::int as n from comments where status = 'new'`;
    pendingComments = r?.n ?? 0;
  } catch { pendingComments = null; }

  return { period, linkedin: { cur: asPoints(cur), prev: asPoints(prev) }, x, topPosts: top, followers, goals, pendingComments };
}

export async function loadReport(freq: Freq, now: Date = new Date()): Promise<Report> {
  return buildReport(await loadReportInput(freq, now));
}
