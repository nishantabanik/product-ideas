export type DayRow = {
  platform: string; day: string; // YYYY-MM-DD (UTC)
  posts: number; impressions: number; likes: number; comments: number; shares: number; clicks: number;
};

export const METRICS = ["impressions", "likes", "comments", "shares", "clicks", "posts"] as const;
export type Metric = (typeof METRICS)[number];
export type Platform = "x" | "linkedin";

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The last `days` UTC days ending at `now`, oldest first. */
export function dayList(now: number, days: number, offset = 0) {
  const end = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  return Array.from({ length: days }, (_, i) => isoDay(end - (days - 1 - i + offset * days) * 86_400_000));
}

export type Built = {
  days: string[];
  perPlatform: Record<Platform, Record<Metric, number[]>>;
  total: Record<Metric, { current: number; previous: number }>;
  byPlatformTotal: Record<Platform, Record<Metric, number>>;
};

export function build(rows: DayRow[], now: number, days: number, platforms: Platform[]): Built {
  const cur = dayList(now, days);
  const prev = dayList(now, days, 1);
  const index = new Map<string, DayRow>();
  for (const r of rows) index.set(`${r.platform}|${r.day}`, r);

  const series = (p: Platform, list: string[], m: Metric) => list.map((d) => index.get(`${p}|${d}`)?.[m] ?? 0);
  const empty = () => Object.fromEntries(METRICS.map((m) => [m, [] as number[]])) as Record<Metric, number[]>;
  const perPlatform = { x: empty(), linkedin: empty() } as Built["perPlatform"];
  const byPlatformTotal = { x: {}, linkedin: {} } as unknown as Built["byPlatformTotal"];
  const total = {} as Built["total"];

  for (const p of ["x", "linkedin"] as const) {
    for (const m of METRICS) {
      perPlatform[p][m] = platforms.includes(p) ? series(p, cur, m) : cur.map(() => 0);
      byPlatformTotal[p][m] = perPlatform[p][m].reduce((a, b) => a + b, 0);
    }
  }
  for (const m of METRICS) {
    const sum = (list: string[]) => platforms.reduce((a, p) => a + series(p, list, m).reduce((x, y) => x + y, 0), 0);
    total[m] = { current: sum(cur), previous: sum(prev) };
  }
  return { days: cur, perPlatform, total, byPlatformTotal };
}

/** Percent change, or null when there is nothing to compare with. */
export function change(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}
