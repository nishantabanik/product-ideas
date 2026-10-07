import { median } from "../advisory/stats.ts";

/**
 * Benchmarks against our own past performance. All days are "YYYY-MM-DD" strings (UTC).
 * A series is daily, or weekly (X only has weekly buckets, each point is the start of a 7 day bucket).
 * With a weekly series every "30 days" below becomes 4 weeks.
 */
export type Point = { day: string; impressions: number; engagements: number };
export type Series = { unit: "day" | "week"; points: Point[] };
export type MetricKey = "impressions" | "engagements";

const DAY = 86_400_000;
const ms = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fmtDay = (t: number) => new Date(t).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => fmtDay(ms(day) + n * DAY);
const diffDays = (a: string, b: string) => Math.round((ms(b) - ms(a)) / DAY);
const num = (n: number) => Math.round(n).toLocaleString("en-US");

export const MIN_COVERAGE = 0.9; // a window needs this share of its days (or weeks) to count
export const USUAL_MIN_DAYS = 90;

export type Comparison = {
  key: "previous" | "yearAgo" | "usual" | "best";
  label: string;
  value: number | null;
  /** latest vs value, in percent, null when we have no number or the baseline is zero */
  deltaPct: number | null;
  /** why we have no number, or a short remark */
  note: string | null;
};

export type MetricBench = {
  latest: number | null;
  comparisons: Comparison[];
  rank: { rank: number; of: number } | null;
};

export type Bench = {
  unit: "day" | "week";
  windowSteps: number;
  windowName: string; // "30 days" or "4 weeks"
  start: string | null;
  end: string | null;
  daysSinceEnd: number; // how stale the latest window is, relative to today
  dataDays: number; // days between the first and last point
  metrics: Record<MetricKey, MetricBench>;
  notes: string[];
};

export const pctChange = (cur: number, base: number) => (base > 0 ? ((cur - base) / base) * 100 : null);

type Grid = { first: string; step: number; vals: (number | null)[]; end: number };

function toGrid(series: Series, metric: MetricKey, today: string): Grid | null {
  if (!series.points.length) return null;
  const step = series.unit === "week" ? 7 : 1;
  const days = series.points.map((p) => p.day).sort();
  const first = days[0];
  // Last full period: yesterday for days, a bucket that ended before today for weeks.
  const lastOk = step === 1 ? addDays(today, -1) : addDays(today, -7);
  const usable = days.filter((d) => d <= lastOk);
  if (!usable.length) return null;
  const last = usable[usable.length - 1];
  const len = Math.floor(diffDays(first, last) / step) + 1;
  const vals: (number | null)[] = Array(len).fill(null);
  for (const p of series.points) {
    if (p.day > last) continue;
    const i = Math.floor(diffDays(first, p.day) / step);
    vals[i] = (vals[i] ?? 0) + p[metric];
  }
  return { first, step, vals, end: len - 1 };
}

/** Total of the window ending at index `end`, scaled up for missing days. Null when too many days are missing. */
function windowTotal(vals: (number | null)[], end: number, n: number): number | null {
  const from = end - n + 1;
  if (from < 0 || end >= vals.length) return null;
  let sum = 0, present = 0;
  for (let i = from; i <= end; i++) if (vals[i] !== null) { sum += vals[i]!; present++; }
  if (present < Math.ceil(n * MIN_COVERAGE)) return null;
  return (sum * n) / present;
}

function benchMetric(g: Grid | null, n: number, unit: "day" | "week", windowName: string, opts: { totalDays: number }): MetricBench {
  const comps = (value: (key: Comparison["key"]) => [number | null, string | null], latest: number | null): Comparison[] => {
    const make = (key: Comparison["key"], label: string): Comparison => {
      const [v, note] = value(key);
      return { key, label, value: v, deltaPct: v !== null && latest !== null ? pctChange(latest, v) : null, note };
    };
    return [make("previous", `The ${windowName} before`), make("yearAgo", `Same ${windowName} a year ago`), make("usual", `Our usual ${windowName}`), make("best", `Our best ${windowName} ever`)];
  };
  if (!g) {
    return { latest: null, rank: null, comparisons: comps(() => [null, "No data yet."], null) };
  }
  const latest = windowTotal(g.vals, g.end, n);
  const yearSteps = unit === "day" ? 365 : 52;
  const lookback = unit === "day" ? 365 : 52;

  // All rolling windows (any end index) with enough coverage.
  const all: { end: number; total: number }[] = [];
  for (let e = n - 1; e <= g.end; e++) { const t = windowTotal(g.vals, e, n); if (t !== null) all.push({ end: e, total: t }); }

  // Non-overlapping blocks counted back from the latest window.
  const blocks: number[] = [];
  for (let e = g.end; e - n + 1 >= 0; e -= n) { const t = windowTotal(g.vals, e, n); if (t !== null) blocks.push(t); }
  const rank = latest !== null && blocks.length >= 2 ? { rank: 1 + blocks.filter((b) => b > latest).length, of: blocks.length } : null;

  const result = comps((key) => {
    if (latest === null) return [null, `The latest ${windowName} has too many missing days.`];
    if (key === "previous") {
      const v = windowTotal(g.vals, g.end - n, n);
      return [v, v === null ? `We have no complete ${windowName} before the latest.` : null];
    }
    if (key === "yearAgo") {
      const v = windowTotal(g.vals, g.end - yearSteps, n);
      return [v, v === null ? "We do not have data from a year ago." : null];
    }
    if (key === "usual") {
      if (opts.totalDays < USUAL_MIN_DAYS) return [null, `We need ${USUAL_MIN_DAYS}+ days of data for a usual ${windowName}. We have ${opts.totalDays}.`];
      const recent = all.filter((w) => w.end > g.end - lookback);
      return recent.length ? [median(recent.map((w) => w.total)), `Median of ${recent.length} rolling windows over the last 12 months.`] : [null, "Not enough complete windows."];
    }
    const best = all.reduce<number | null>((m, w) => (m === null || w.total > m ? w.total : m), null);
    return [best, best !== null && latest >= best ? "This is our best." : null];
  }, latest);
  return { latest, comparisons: result, rank };
}

/** Compares the latest full window (30 days, or 4 weeks for weekly series) with earlier ones. */
export function benchmark(series: Series, today: string): Bench {
  const unit = series.unit;
  const n = unit === "day" ? 30 : 4;
  const windowName = unit === "day" ? "30 days" : "4 weeks";
  const notes: string[] = [];
  const g = toGrid(series, "impressions", today);
  const ge = toGrid(series, "engagements", today);
  const span = g ? (g.end + 1) * g.step : 0;
  const metrics = {
    impressions: benchMetric(g, n, unit, windowName, { totalDays: span }),
    engagements: benchMetric(ge, n, unit, windowName, { totalDays: span }),
  };
  let start: string | null = null, end: string | null = null;
  if (g) {
    end = addDays(g.first, g.end * g.step + (unit === "week" ? 6 : 0));
    start = addDays(end, -(n * g.step) + 1);
  }
  if (unit === "week") notes.push("X only gives us weekly numbers, so we compare 4-week windows instead of 30 days, and there is no daily record.");
  if (!g) notes.push("We have no numbers yet.");
  else {
    if (span < USUAL_MIN_DAYS) notes.push(`We hold ${span} days of data. Our usual ${windowName} needs ${USUAL_MIN_DAYS} or more.`);
    if (metrics.impressions.latest === null) notes.push(`The latest ${windowName} has too many missing days to compare.`);
    if (metrics.impressions.latest === 0) notes.push(`There were no impressions in the latest ${windowName}.`);
    const daysSince = diffDays(end!, today) - 1;
    if (daysSince > 3) notes.push(`Our newest numbers end ${daysSince} days ago, so the latest ${windowName} ends then too.`);
  }
  return { unit, windowSteps: n, windowName, start, end, daysSinceEnd: end ? diffDays(end, today) - 1 : 0, dataDays: span, metrics, notes };
}

/** The one sentence at the top, for example "Last 30 days: 12,400 impressions, 18% above our usual month, 3rd best of 14 periods of 30 days". */
export function headline(b: Bench): string {
  const m = b.metrics.impressions;
  if (m.latest === null) return b.end ? `We cannot compare the latest ${b.windowName} yet.` : "We have no numbers to compare yet.";
  const parts = [`${num(m.latest)} impressions`];
  const usual = m.comparisons.find((c) => c.key === "usual")!;
  if (usual.deltaPct !== null) {
    const d = usual.deltaPct;
    parts.push(Math.abs(d) < 1 ? `in line with our usual ${b.windowName}` : `${Math.round(Math.abs(d))}% ${d > 0 ? "above" : "below"} our usual ${b.windowName}`);
  }
  if (m.rank) parts.push(`${ordinal(m.rank.rank)} best of ${m.rank.of} periods of ${b.windowName}`);
  return `Last ${b.windowName}: ${parts.join(", ")}.`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/* ---------- records ---------- */

export type PostLite = { id: string; impressions: number | null; publishedAt: string | null; content?: string };

export type Records = {
  bestDay: { day: string; value: number } | null;
  bestWeek: { start: string; value: number } | null;
  bestMonth: { month: string; value: number } | null; // "2026-03"
  bestPost: { id: string; impressions: number; publishedAt: string | null } | null;
  latestPost: { id: string; impressions: number; percentile: number | null; of: number } | null; // percentile 0 to 100
  notes: string[];
};

const weekStart = (day: string) => addDays(day, -((new Date(ms(day)).getUTCDay() + 6) % 7));

export function records(series: Series, posts: PostLite[], today: string): Records {
  const notes: string[] = [];
  const pts = series.points.filter((p) => p.day <= today);
  let bestDay: Records["bestDay"] = null, bestWeek: Records["bestWeek"] = null, bestMonth: Records["bestMonth"] = null;
  if (series.unit === "day") {
    for (const p of pts) if (p.impressions > 0 && (!bestDay || p.impressions > bestDay.value)) bestDay = { day: p.day, value: p.impressions };
    const weeks = new Map<string, number>(), months = new Map<string, number>();
    for (const p of pts) {
      weeks.set(weekStart(p.day), (weeks.get(weekStart(p.day)) ?? 0) + p.impressions);
      months.set(p.day.slice(0, 7), (months.get(p.day.slice(0, 7)) ?? 0) + p.impressions);
    }
    for (const [k, v] of weeks) if (v > 0 && (!bestWeek || v > bestWeek.value)) bestWeek = { start: k, value: v };
    for (const [k, v] of months) if (v > 0 && (!bestMonth || v > bestMonth.value)) bestMonth = { month: k, value: v };
    if (pts.length) notes.push("Weeks and months with missing days count only the days we have, so they can only be too low, never too high.");
  } else {
    for (const p of pts) if (p.impressions > 0 && (!bestWeek || p.impressions > bestWeek.value)) bestWeek = { start: p.day, value: p.impressions };
    notes.push("X gives us weekly numbers only, so there is no best day or best month.");
  }

  const withNum = posts.filter((p) => p.impressions !== null && p.impressions > 0);
  const bestPost = withNum.reduce<Records["bestPost"]>((m, p) => (!m || p.impressions! > m.impressions ? { id: p.id, impressions: p.impressions!, publishedAt: p.publishedAt } : m), null);

  // Latest post against the posts of the 12 months before it.
  let latestPost: Records["latestPost"] = null;
  const dated = withNum.filter((p) => p.publishedAt).sort((a, b) => (b.publishedAt! > a.publishedAt! ? 1 : -1));
  if (dated.length) {
    const latest = dated[0];
    const since = addDays(latest.publishedAt!.slice(0, 10), -365);
    const peers = dated.filter((p) => p.publishedAt!.slice(0, 10) >= since);
    const others = peers.filter((p) => p.id !== latest.id);
    const pc = others.length >= 9 ? (others.filter((p) => p.impressions! < latest.impressions!).length / others.length) * 100 : null;
    latestPost = { id: latest.id, impressions: latest.impressions!, percentile: pc, of: peers.length };
    if (pc === null) notes.push(`We hold only ${peers.length} posts with numbers from the last 12 months. We need 10 to rank the latest one.`);
    else notes.push("The latest post may still be gaining impressions, so its rank can rise.");
  } else if (!withNum.length) notes.push("We have no posts with impressions to rank.");

  return { bestDay, bestWeek, bestMonth, bestPost, latestPost, notes };
}
