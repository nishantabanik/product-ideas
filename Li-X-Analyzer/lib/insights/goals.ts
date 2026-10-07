/**
 * Goal tracking, pure logic. A goal is a target for a metric over the current week (ISO, Monday to Sunday, UTC)
 * or calendar month (UTC). All days are "YYYY-MM-DD" strings.
 */
export type GoalPlatform = "linkedin" | "x" | "both";
export type GoalMetric = "impressions" | "engagements" | "likes" | "comments" | "posts";
export type GoalPeriod = "week" | "month";
export type GoalStatus = "achieved" | "on_track" | "behind" | "no_data";

export const GOAL_PLATFORMS: GoalPlatform[] = ["linkedin", "x", "both"];
export const GOAL_METRICS: GoalMetric[] = ["impressions", "engagements", "likes", "comments", "posts"];
export const GOAL_PERIODS: GoalPeriod[] = ["week", "month"];
export const MAX_GOALS = 12;
export const MAX_TARGET = 1_000_000_000;

export type Goal = { id: string; platform: GoalPlatform; metric: GoalMetric; period: GoalPeriod; target: number };
export type DailyRow = { day: string; value: number };

export type Progress = {
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  elapsedDays: number; // days from the period start through today
  remainingDays: number; // days after today
  current: number;
  projected: number | null;
  requiredPerDay: number | null;
  tooEarly: boolean;
  status: GoalStatus;
  explanation: string;
};

const DAY = 86_400_000;
const ms = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fmtDay = (t: number) => new Date(t).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => fmtDay(ms(day) + n * DAY);
const diffDays = (a: string, b: string) => Math.round((ms(b) - ms(a)) / DAY);
const num = (n: number) => Math.round(n).toLocaleString("en-US");

/** First and last day of the week or month that holds `day`. */
export function periodBounds(period: GoalPeriod, day: string): { start: string; end: string } {
  const d = new Date(ms(day));
  if (period === "month") {
    const y = d.getUTCFullYear(), m = d.getUTCMonth();
    return { start: fmtDay(Date.UTC(y, m, 1)), end: fmtDay(Date.UTC(y, m + 1, 0)) };
  }
  const start = fmtDay(ms(day) - ((d.getUTCDay() + 6) % 7) * DAY);
  return { start, end: addDays(start, 6) };
}

const METRIC_WORD: Record<GoalMetric, string> = { impressions: "impressions", engagements: "engagements", likes: "likes", comments: "comments", posts: "posts" };
const PLATFORM_WORD: Record<GoalPlatform, string> = { linkedin: "LinkedIn", x: "X", both: "LinkedIn and X" };

/** For example "100,000 impressions a month on LinkedIn". */
export function goalLabel(g: Pick<Goal, "platform" | "metric" | "period" | "target">): string {
  const word = g.target === 1 && g.metric === "posts" ? "post" : METRIC_WORD[g.metric];
  return `${num(g.target)} ${word} a ${g.period} on ${PLATFORM_WORD[g.platform]}`;
}

export function goalProgress(goal: Pick<Goal, "metric" | "period" | "target">, dailyRows: DailyRow[], now: Date): Progress {
  const today = now.toISOString().slice(0, 10);
  const { start, end } = periodBounds(goal.period, today);
  const totalDays = diffDays(start, end) + 1;
  const elapsedDays = diffDays(start, today) + 1;
  const remainingDays = totalDays - elapsedDays;

  const inPeriod = dailyRows.filter((r) => r.day >= start && r.day <= today);
  const current = inPeriod.reduce((a, r) => a + r.value, 0);
  const from14 = addDays(today, -13);
  const last14 = dailyRows.filter((r) => r.day >= from14 && r.day <= today);
  const tooEarly = elapsedDays <= 2;

  const base = { periodStart: start, periodEnd: end, totalDays, elapsedDays, remainingDays, current, tooEarly };
  const unit = METRIC_WORD[goal.metric];

  if (current >= goal.target) {
    return { ...base, projected: current, requiredPerDay: 0, status: "achieved", explanation: `Reached. We are at ${num(current)} of ${num(goal.target)} ${unit} with ${remainingDays} day${remainingDays === 1 ? "" : "s"} left.` };
  }
  if (!inPeriod.length && !last14.length) {
    return { ...base, projected: null, requiredPerDay: remainingDays > 0 ? (goal.target - current) / remainingDays : null, status: "no_data", explanation: `We have no ${unit} numbers for this ${goal.period} yet, so we cannot say how we are doing.` };
  }

  // Rate: the days of this period so far, or the last 14 days while the period has just started.
  const rate = tooEarly ? last14.reduce((a, r) => a + r.value, 0) / 14 : current / elapsedDays;
  const projected = current + rate * remainingDays;
  const requiredPerDay = remainingDays > 0 ? (goal.target - current) / remainingDays : null;
  const status: GoalStatus = projected >= goal.target * 0.95 ? "on_track" : "behind";

  let explanation: string;
  if (remainingDays === 0) {
    explanation = `Last day of the ${goal.period}. We are at ${num(current)} of ${num(goal.target)} ${unit}, so ${num(goal.target - current)} short.`;
  } else {
    const pace = `at our pace of ${num(rate)} a day we end near ${num(projected)}`;
    const need = `we need ${num(requiredPerDay!)} a day`;
    explanation = tooEarly
      ? `Too early to tell, only ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} in. Using our last 14 days, ${pace}, and ${need}.`
      : status === "on_track"
        ? `On track: ${pace}, against a target of ${num(goal.target)}. To reach it exactly ${need}.`
        : `Behind: ${pace}, short of ${num(goal.target)}. To reach it ${need}.`;
  }
  return { ...base, projected, requiredPerDay, status, explanation };
}

export type GoalInput = { platform?: unknown; metric?: unknown; period?: unknown; target?: unknown };

/** Validates a new goal from the API. Returns the clean goal or an error message. */
export function validateGoal(input: GoalInput, existing: number): { ok: true; goal: Omit<Goal, "id"> } | { ok: false; error: string } {
  if (existing >= MAX_GOALS) return { ok: false, error: `We can track at most ${MAX_GOALS} goals. Delete one first.` };
  if (!GOAL_PLATFORMS.includes(input.platform as GoalPlatform)) return { ok: false, error: "Choose LinkedIn, X or both." };
  if (!GOAL_METRICS.includes(input.metric as GoalMetric)) return { ok: false, error: "Choose a metric." };
  if (!GOAL_PERIODS.includes(input.period as GoalPeriod)) return { ok: false, error: "Choose a week or a month." };
  const target = typeof input.target === "string" ? Number(input.target) : input.target;
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) return { ok: false, error: "The target must be a number above zero." };
  if (target > MAX_TARGET) return { ok: false, error: `The target is too large. Keep it under ${num(MAX_TARGET)}.` };
  if (input.metric === "posts" && (!Number.isInteger(target) || target > 1000)) return { ok: false, error: "Posts must be a whole number, at most 1,000." };
  return { ok: true, goal: { platform: input.platform as GoalPlatform, metric: input.metric as GoalMetric, period: input.period as GoalPeriod, target: Math.round(target) } };
}

/** Spreads weekly totals evenly over their days. `weeks` start on `start` and cover 7 days each. */
export function spreadWeekly(weeks: { start: string; value: number }[]): DailyRow[] {
  return weeks.flatMap((w) => Array.from({ length: 7 }, (_, i) => ({ day: addDays(w.start, i), value: w.value / 7 })));
}

/** Adds several daily series together (the "both platforms" goal). */
export function mergeDaily(...series: DailyRow[][]): DailyRow[] {
  const m = new Map<string, number>();
  for (const s of series) for (const r of s) m.set(r.day, (m.get(r.day) ?? 0) + r.value);
  return [...m].map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day));
}
