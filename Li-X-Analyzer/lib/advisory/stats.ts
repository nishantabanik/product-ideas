export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function percentile(xs: number[], p: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

/** Coefficient of variation: spread relative to the average. */
export function cv(xs: number[]) {
  const m = mean(xs);
  if (!m) return 0;
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) / m;
}

export const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

/** Share of values at or below `v`, from 0 to 1 (a value's rank among its peers). */
export function rankShare(v: number, xs: number[]) {
  if (xs.length < 2) return 0.5;
  return xs.filter((x) => x < v).length / (xs.length - 1);
}

export const pct = (n: number, d = 0) => `${n.toFixed(d)}%`;
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const change = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : null);

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const dayOfWeek = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
