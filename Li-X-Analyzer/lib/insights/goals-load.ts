import { dailyBuckets } from "../analytics-data";
import { db, ensureSchema } from "../db";
import { addDays, goalLabel, goalProgress, mergeDaily, periodBounds, spreadWeekly, type DailyRow, type Goal, type GoalMetric, type Progress } from "./goals.ts";
import { listGoals } from "./goals-store";

/** Progress on our goals, for the Goals tab and for the report. */
export type GoalView = {
  id: string;
  platform: "linkedin" | "x" | "both";
  metric: string;
  period: "week" | "month";
  target: number;
  current: number;
  projected: number | null;
  requiredPerDay: number | null;
  status: "achieved" | "on_track" | "behind" | "no_data";
  label: string; // for example "100,000 impressions a month on LinkedIn"
};

export type GoalDetail = GoalView & { progress: Progress };

async function linkedinDaily(metric: GoalMetric, from: string, to: string): Promise<DailyRow[]> {
  if (metric === "posts") return postsDaily("linkedin", from, to);
  const rows = await dailyBuckets("linkedin", from, to, "day");
  const out: DailyRow[] = [];
  for (const r of rows) {
    const v = metric === "impressions" ? r.impressions : metric === "engagements" ? r.engagements : metric === "likes" ? r.likes : r.comments;
    if (v !== null && v !== undefined && r.days > 0) out.push({ day: r.start, value: Number(v) });
  }
  return out;
}

async function postsDaily(platform: string, from: string, to: string): Promise<DailyRow[]> {
  await ensureSchema();
  const rows = await db()<{ day: string; n: number }[]>`
    select to_char((published_at at time zone 'UTC')::date, 'YYYY-MM-DD') as day, count(*)::int as n
    from posts where platform = ${platform} and state = 'PUBLISHED' and published_at is not null
      and (published_at at time zone 'UTC')::date between ${from}::date and ${to}::date
    group by 1 order by 1`;
  // Days without posts are real zeros for a post count.
  const map = new Map(rows.map((r) => [r.day, r.n]));
  const out: DailyRow[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ day: d, value: map.get(d) ?? 0 });
  return out;
}

type XWeek = { week: number; impressions: number; likes: number; comments: number; shares: number; captured: Date };

/** X has weekly buckets only: week 1 is the 7 days before we captured the numbers, week 2 the 7 before that. */
async function xWeeks(): Promise<XWeek[]> {
  await ensureSchema();
  return db()<XWeek[]>`
    select ab.week, sum(ab.impressions)::float8 as impressions, sum(ab.likes)::float8 as likes, sum(ab.comments)::float8 as comments,
           sum(ab.shares)::float8 as shares, max(ab.captured_at) as captured
    from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week order by ab.week`;
}

function xDaily(metric: GoalMetric, weeks: XWeek[]): DailyRow[] {
  if (!weeks.length) return [];
  const captured = new Date(weeks[0].captured).toISOString().slice(0, 10);
  return spreadWeekly(weeks.map((w) => ({
    start: addDays(captured, -7 * w.week),
    value: metric === "impressions" ? w.impressions : metric === "likes" ? w.likes : metric === "comments" ? w.comments : w.likes + w.comments + w.shares,
  })));
}

async function dailyFor(goal: Goal, from: string, to: string, weeks: () => Promise<XWeek[]>): Promise<DailyRow[]> {
  const li = goal.platform !== "x" ? await linkedinDaily(goal.metric, from, to) : [];
  const x = goal.platform !== "linkedin" ? (goal.metric === "posts" ? await postsDaily("x", from, to) : xDaily(goal.metric, await weeks())) : [];
  return mergeDaily(li, x);
}

export async function loadGoalDetails(now: Date = new Date()): Promise<GoalDetail[]> {
  const goals = await listGoals();
  if (!goals.length) return [];
  const today = now.toISOString().slice(0, 10);
  let cache: Promise<XWeek[]> | null = null;
  const weeks = () => (cache ??= xWeeks());
  const out: GoalDetail[] = [];
  for (const g of goals) {
    const start = periodBounds(g.period, today).start;
    const from = start < addDays(today, -13) ? start : addDays(today, -13);
    const rows = await dailyFor(g, from, today, weeks);
    const progress = goalProgress(g, rows, now);
    out.push({
      id: g.id, platform: g.platform, metric: g.metric, period: g.period, target: g.target,
      current: progress.current, projected: progress.projected, requiredPerDay: progress.requiredPerDay,
      status: progress.status, label: goalLabel(g), progress,
    });
  }
  return out;
}

export async function loadGoalProgress(now: Date = new Date()): Promise<GoalView[]> {
  const details = await loadGoalDetails(now);
  return details.map(({ progress: _p, ...v }) => v);
}
