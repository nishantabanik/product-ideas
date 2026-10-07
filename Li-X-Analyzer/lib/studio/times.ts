import type { PostFact, Platform } from "./types.ts";

export type Cell = { weekday: number; hour: number; n: number; score: number | null };
export type Times = {
  enough: boolean;
  posts: number;
  grid: Cell[]; // 7 x 24, weekday 0 = Sunday, in the chosen time zone
  top: { weekday: number; hour: number; n: number; score: number }[];
  starter: { weekday: number; hour: number }[];
};

/** Local weekday and hour of an instant in a time zone. */
export function localParts(iso: string, tz: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  return { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), hour };
}

const STARTER: Record<Platform, { weekday: number; hour: number }[]> = {
  linkedin: [2, 3, 4].flatMap((weekday) => [8, 12].map((hour) => ({ weekday, hour }))),
  x: [1, 2, 3, 4, 5].flatMap((weekday) => [9, 13, 17].map((hour) => ({ weekday, hour }))),
};

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };

/**
 * When our posts did best. Every post is compared with the account's typical post, so growth over the years does not make recent
 * hours look better. Hours with few posts are pulled toward average (a prior worth two posts), so one lucky post cannot win.
 */
export function bestTimes(posts: PostFact[], platform: Platform, tz: string): Times {
  const rows = posts.filter((p) => p.platform === platform && p.publishedAt && (p.impressions ?? 0) > 0);
  const typical = median(rows.map((p) => p.impressions!));
  const sums = new Map<string, { s: number; n: number }>();
  for (const p of rows) {
    const { weekday, hour } = localParts(p.publishedAt!, tz);
    const k = `${weekday}:${hour}`;
    const c = sums.get(k) ?? { s: 0, n: 0 };
    c.s += p.impressions! / typical; c.n += 1;
    sums.set(k, c);
  }
  const PRIOR = 2;
  const grid: Cell[] = [];
  for (let weekday = 0; weekday < 7; weekday++) for (let hour = 0; hour < 24; hour++) {
    const c = sums.get(`${weekday}:${hour}`);
    grid.push({ weekday, hour, n: c?.n ?? 0, score: c ? (c.s + PRIOR) / (c.n + PRIOR) : null });
  }
  const enough = rows.length >= 20;
  const top = grid.filter((c) => c.n >= 2 && c.score != null && c.score >= 1.15).sort((a, b) => b.score! - a.score!).slice(0, 6).map((c) => ({ weekday: c.weekday, hour: c.hour, n: c.n, score: c.score! }));
  return { enough, posts: rows.length, grid, top, starter: STARTER[platform] };
}
