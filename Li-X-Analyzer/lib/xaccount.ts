import type { AnalyticsSeries } from "./postiz.ts";
import { summarizeSeries } from "./postiz.ts";

export const WEEKS = 12;

export type Totals = { impressions: number; likes: number; comments: number; shares: number; bookmarks: number };
export const ZERO: Totals = { impressions: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 };
const KEYS = Object.keys(ZERO) as (keyof Totals)[];

export function totalsFromSeries(series: AnalyticsSeries[] | { missing: true }): Totals {
  const m = summarizeSeries(series);
  return { impressions: m.impressions ?? 0, likes: m.likes ?? 0, comments: m.comments ?? 0, shares: m.shares ?? 0, bookmarks: m.bookmarks ?? 0 };
}

/**
 * Postiz returns one total for "all our original X posts from the last N days".
 * Given those running totals for 7, 14, 21... days, the posts of each separate week are the differences.
 * Returns null when the running totals shrink, which means one call failed quietly (Postiz returns an empty list on errors).
 */
export function weeklyBuckets(running: Totals[]): Totals[] | null {
  const out: Totals[] = [];
  for (let i = 0; i < running.length; i++) {
    const prev = i ? running[i - 1] : ZERO;
    const bucket = { ...ZERO };
    for (const k of KEYS) {
      const diff = running[i][k] - prev[k];
      if (diff < 0) return null;
      bucket[k] = diff;
    }
    out.push(bucket);
  }
  return out;
}

export const sumTotals = (list: Totals[]): Totals =>
  list.reduce((a, b) => Object.fromEntries(KEYS.map((k) => [k, a[k] + b[k]])) as Totals, { ...ZERO });
