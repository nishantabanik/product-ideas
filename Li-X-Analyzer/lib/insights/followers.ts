import { median } from "../advisory/stats.ts";
import { addDays, daysBetween } from "../ranges.ts";

/** Follower growth, and which posts came just before our best gains. Pure: no database, no clock. */

export type FollowerDay = { day: string; total: number | null; gained: number | null; lost: number | null };
export type NetDay = { day: string; net: number };
export type Basis = "gained-lost" | "gained" | "totals" | "mixed" | "none";
export type PostIn = { id: string; platform: string; published_at: string | Date | null; content: string };

export const MIN_DAYS = 14;
export const MIN_POSTS = 5;
export const THIN_WINDOWS = 5;
export const NOISE_FACTOR = 1.5;

export const basisText = (b: Basis) =>
  b === "gained-lost" ? "new followers minus unfollows"
  : b === "gained" ? "new followers (no unfollow numbers, so losses are not counted)"
  : b === "totals" ? "the day to day change in our total follower count"
  : b === "mixed" ? "new followers minus unfollows where we have them, and the change in the total on the other days"
  : "no usable numbers";

/**
 * One net number per day. A day with new followers or unfollows uses them. Otherwise the change in total from the day before,
 * and only when that day before is the previous calendar day. Days we cannot work out are left out, never filled in.
 */
export function netSeries(rows: FollowerDay[]): { days: NetDay[]; basis: Basis } {
  const sorted = [...new Map(rows.map((r) => [r.day, r])).values()].sort((a, b) => (a.day < b.day ? -1 : 1));
  const byDay = new Map(sorted.map((r) => [r.day, r]));
  const days: NetDay[] = [];
  let withLoss = 0, gainOnly = 0, fromTotals = 0;
  for (const r of sorted) {
    if (r.gained !== null || r.lost !== null) {
      days.push({ day: r.day, net: (r.gained ?? 0) - (r.lost ?? 0) });
      if (r.lost !== null) withLoss++; else gainOnly++;
      continue;
    }
    const prev = byDay.get(addDays(r.day, -1));
    if (r.total !== null && prev && prev.total !== null) {
      days.push({ day: r.day, net: r.total - prev.total });
      fromTotals++;
    }
  }
  const kinds = [withLoss, gainOnly, fromTotals].filter((n) => n > 0).length;
  const basis: Basis = kinds === 0 ? "none" : kinds > 1 ? "mixed" : withLoss ? "gained-lost" : gainOnly ? "gained" : "totals";
  return { days, basis };
}

export function sumNet(days: NetDay[], from: string, to: string) {
  const inside = days.filter((d) => d.day >= from && d.day <= to);
  return { sum: inside.reduce((a, d) => a + d.net, 0), days: inside.length, span: daysBetween(from, to) };
}

export function bestDay(days: NetDay[]): NetDay | null {
  let best: NetDay | null = null;
  for (const d of days) if (!best || d.net > best.net || (d.net === best.net && d.day > best.day)) best = d;
  return best && best.net > 0 ? best : null;
}

/** Chart values: the totals when we have them, else the running sum of the net gains (which starts at zero, not at our real count). */
export function chartSeries(rows: FollowerDay[], days: NetDay[]): { kind: "total" | "cumulative"; points: { day: string; y: number }[] } {
  const totals = rows.filter((r) => r.total !== null).sort((a, b) => (a.day < b.day ? -1 : 1));
  if (totals.length >= 2) return { kind: "total", points: totals.map((r) => ({ day: r.day, y: r.total as number })) };
  let run = 0;
  return { kind: "cumulative", points: days.map((d) => ({ day: d.day, y: (run += d.net) })) };
}

export const latestTotal = (rows: FollowerDay[]) => {
  const t = rows.filter((r) => r.total !== null).sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  return t ? { total: t.total as number, day: t.day } : null;
};

/* ---------- attribution ---------- */

export type RankedPost = {
  id: string; platform: string; content: string; publishedAt: string; day: string;
  gain: number; excess: number; linked: boolean; sharedWith: number;
};
export type Analysis = {
  enough: boolean;
  missing: string[];
  basis: Basis;
  netDays: number;
  postsUsed: number;
  postsSkipped: number;
  baseline: number;
  noise: number;
  baselineKind: "median" | "average";
  ranked: RankedPost[];
};

const dayOf = (v: string | Date) => (v instanceof Date ? v : new Date(v)).toISOString().slice(0, 10);
const isoOf = (v: string | Date) => (v instanceof Date ? v : new Date(v)).toISOString();

function sd(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/**
 * For one platform. The 48 hours from publication are taken as the publication day and the next day, because our numbers are per
 * day. A post is only scored when both days have numbers. The baseline is the median two day gain over windows that hold no post
 * start, or twice the average day when there are fewer than 5 such windows. The noise is the spread of those same windows.
 */
export function analyzePlatform(rows: FollowerDay[], posts: PostIn[]): Analysis {
  const { days, basis } = netSeries(rows);
  const net = new Map(days.map((d) => [d.day, d.net]));
  const dated = posts.filter((p) => p.published_at && !Number.isNaN(new Date(p.published_at).getTime()));
  const rowDays = [...new Set(rows.filter((r) => r.total !== null || r.gained !== null || r.lost !== null).map((r) => r.day))].sort();
  const first = rowDays[0], last = rowDays[rowDays.length - 1];
  const inRange = first ? dated.filter((p) => dayOf(p.published_at!) >= first && dayOf(p.published_at!) <= last) : [];

  const missing: string[] = [];
  if (rowDays.length < MIN_DAYS) missing.push(`${MIN_DAYS - rowDays.length} more days of follower numbers (we have ${rowDays.length}, we need ${MIN_DAYS})`);
  if (inRange.length < MIN_POSTS) missing.push(`${MIN_POSTS - inRange.length} more posts published during the days we have follower numbers for (we have ${inRange.length}, we need ${MIN_POSTS})`);
  const empty: Analysis = { enough: false, missing, basis, netDays: days.length, postsUsed: 0, postsSkipped: inRange.length, baseline: 0, noise: 0, baselineKind: "median", ranked: [] };
  if (missing.length) return empty;

  const postDays = new Map<string, number>();
  for (const p of inRange) postDays.set(dayOf(p.published_at!), (postDays.get(dayOf(p.published_at!)) ?? 0) + 1);

  const windows: { start: string; gain: number }[] = [];
  for (const d of days) {
    const n2 = net.get(addDays(d.day, 1));
    if (n2 !== undefined) windows.push({ start: d.day, gain: d.net + n2 });
  }
  const clean = windows.filter((w) => !postDays.has(w.start) && !postDays.has(addDays(w.start, 1))).map((w) => w.gain);
  let baseline: number, noise: number, baselineKind: "median" | "average";
  if (clean.length >= THIN_WINDOWS) {
    baseline = median(clean);
    noise = 1.4826 * median(clean.map((g) => Math.abs(g - baseline)));
    baselineKind = "median";
  } else {
    const daily = days.map((d) => d.net);
    baseline = daily.length ? (daily.reduce((a, b) => a + b, 0) / daily.length) * 2 : 0;
    noise = sd(daily) * Math.SQRT2;
    baselineKind = "average";
  }
  noise = Math.max(1, noise);

  const ranked: RankedPost[] = [];
  let skipped = 0;
  for (const p of inRange) {
    const day = dayOf(p.published_at!);
    const a = net.get(day), b = net.get(addDays(day, 1));
    if (a === undefined || b === undefined) { skipped++; continue; }
    const gain = a + b;
    const excess = gain - baseline;
    // Another post starting in this window, or one whose window overlaps ours, shares the same days.
    const others = inRange.filter((o) => {
      if (o.id === p.id) return false;
      const od = dayOf(o.published_at!);
      return od >= addDays(day, -1) && od <= addDays(day, 1);
    }).length;
    ranked.push({ id: p.id, platform: p.platform, content: p.content, publishedAt: isoOf(p.published_at!), day, gain, excess, linked: excess > 0 && excess >= NOISE_FACTOR * noise, sharedWith: others });
  }
  ranked.sort((x, y) => y.excess - x.excess || (x.publishedAt < y.publishedAt ? 1 : -1));
  return { enough: true, missing: [], basis, netDays: days.length, postsUsed: ranked.length, postsSkipped: skipped, baseline, noise, baselineKind, ranked };
}
