export type Unit = "day" | "week" | "month";
export type Preset = "7d" | "30d" | "90d" | "6m" | "1y" | "2y" | "3y" | "all";

export const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "90d", label: "90D" }, { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" }, { value: "2y", label: "2Y" }, { value: "3y", label: "3Y" }, { value: "all", label: "All" },
];

const DAY = 86_400_000;
export const MAX_DAYS = 3660;

const parse = (day: string) => Date.parse(`${day}T00:00:00Z`);
export const fmtDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const isDay = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtDay(parse(s)) === s;
export const addDays = (day: string, n: number) => fmtDay(parse(day) + n * DAY);
export const daysBetween = (from: string, to: string) => Math.round((parse(to) - parse(from)) / DAY) + 1;

function addMonths(day: string, n: number) {
  const d = new Date(parse(day));
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return fmtDay(target.getTime());
}

export type Range = { from: string; to: string; days: number; preset: Preset | "custom"; unit: Unit; prevFrom: string; prevTo: string };

/** Auto granularity keeps charts readable: daily up to about 3 months, weekly up to about 13 months, monthly beyond. */
export function autoUnit(days: number): Unit {
  return days <= 92 ? "day" : days <= 400 ? "week" : "month";
}

/**
 * Presets end at the latest day we have data for (or today when there is none), so "last 30 days" is never an empty window
 * just because the newest export is a week old.
 */
export function resolveRange(
  q: { range?: string; from?: string; to?: string; g?: string; n?: string; u?: string },
  today: string,
  data: { min: string | null; max: string | null },
): Range {
  let to = data.max && data.max < today ? data.max : today;
  let from: string;
  let preset: Range["preset"];

  if (isDay(q.from) && isDay(q.to) && q.from <= q.to) {
    from = q.from; to = q.to; preset = "custom";
  } else if (/^\d{1,4}$/.test(q.n ?? "") && Number(q.n) > 0 && ["d", "m", "y"].includes(q.u ?? "")) {
    // "last N days / months / years", for example the last 5 years
    const n = Number(q.n);
    from = q.u === "d" ? addDays(to, -(n - 1)) : addDays(addMonths(to, -(q.u === "m" ? n : n * 12)), 1);
    preset = "custom";
  } else {
    preset = (PRESETS.some((p) => p.value === q.range) ? q.range : "30d") as Preset;
    if (preset === "all") from = data.min ?? addDays(to, -29);
    else if (preset === "7d") from = addDays(to, -6);
    else if (preset === "30d") from = addDays(to, -29);
    else if (preset === "90d") from = addDays(to, -89);
    else from = addDays(addMonths(to, preset === "6m" ? -6 : preset === "1y" ? -12 : preset === "2y" ? -24 : -36), 1);
  }
  if (daysBetween(from, to) > MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1));
  const days = daysBetween(from, to);
  const unit = (["day", "week", "month"] as const).find((u) => u === q.g) ?? autoUnit(days);
  const prevTo = addDays(from, -1);
  return { from, to, days, preset, unit, prevFrom: addDays(prevTo, -(days - 1)), prevTo };
}

/** Start of the day, ISO week (Monday) or month that contains `day`. */
export function bucketStart(day: string, unit: Unit) {
  const d = new Date(parse(day));
  if (unit === "month") return fmtDay(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  if (unit === "week") return fmtDay(parse(day) - ((d.getUTCDay() + 6) % 7) * DAY);
  return day;
}

export function bucketGrid(from: string, to: string, unit: Unit) {
  const out: string[] = [];
  for (let b = bucketStart(from, unit); b <= to; ) {
    out.push(b);
    const d = new Date(parse(b));
    b = unit === "day" ? addDays(b, 1) : unit === "week" ? addDays(b, 7) : fmtDay(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  }
  return out;
}

type Extra = number | null | undefined;
export type Bucket = { start: string; impressions: number; engagements: number; days: number; likes?: Extra; comments?: Extra; shares?: Extra; clicks?: Extra };
export type SeriesPoint = {
  t: number; impressions: number | null; engagements: number | null; likes: number | null; comments: number | null; shares: number | null; partial: boolean;
};

const nextStart = (start: string, unit: Unit) => {
  const d = new Date(parse(start));
  return unit === "day" ? addDays(start, 1) : unit === "week" ? addDays(start, 7) : fmtDay(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
};

/**
 * One point per bucket across the whole range. Buckets with no data at all are null, never a misleading zero.
 * A bucket is partial when the range cuts it off (the first and last week or month) or some of its days have no data,
 * so the chart can draw it differently instead of showing a fake dip.
 */
export function toSeries(rows: Bucket[], from: string, to: string, unit: Unit): SeriesPoint[] {
  const byStart = new Map(rows.map((r) => [r.start, r]));
  return bucketGrid(from, to, unit).map((start) => {
    const r = byStart.get(start);
    const end = addDays(nextStart(start, unit), -1);
    const inside = (start < from ? from : start) <= (end > to ? to : end) ? daysBetween(start < from ? from : start, end > to ? to : end) : 0;
    const cut = start < from || end > to;
    const has = !!r && r.days > 0;
    return {
      t: parse(start),
      impressions: has ? r!.impressions : null,
      engagements: has ? r!.engagements : null,
      likes: has ? r!.likes ?? null : null,
      comments: has ? r!.comments ?? null : null,
      shares: has ? r!.shares ?? null : null,
      partial: unit !== "day" && has && (cut || r!.days < inside),
    };
  });
}

export type Metric = "impressions" | "engagements" | "likes" | "comments" | "shares";
export const sum = (pts: SeriesPoint[], k: Metric) => pts.reduce((a, p) => a + (p[k] ?? 0), 0);
/** True when at least one period has a number for the metric, so we can tell "zero" from "not in the export". */
export const has = (pts: SeriesPoint[], k: Metric) => pts.some((p) => p[k] !== null);
