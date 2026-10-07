import { addDays, change, dayOfWeek, mean, sum, cv } from "./stats.ts";
import { textFeatures, type Features } from "./features.ts";
import type { AdvisoryInput, DailyFact, Platform, PostFact, XWeek } from "./types.ts";

export type TextPost = { post: PostFact; f: Features; impressions: number; engagements: number; rate: number };

export type Ctx = {
  now: string;
  today: string;
  input: AdvisoryInput;
  li: {
    has: boolean;
    days: number;
    lastDay: string | null;
    staleDays: number | null;
    last28: { imp: number; eng: number; days: number } | null;
    prev28: { imp: number; eng: number; days: number } | null;
    erBaseline: number | null;
    weekday: { avg: number[]; n: number[]; overall: number } | null;
    dead: { share: number; days: number; of: number } | null;
    topShare: number | null; // share of impressions held by the top 10 percent of days
    weeklyCv: number | null;
  };
  x: {
    has: boolean;
    last4: XWeek | null;
    prev4: XWeek | null;
    base: XWeek | null; // weeks 5 to 12 combined
    baseWeeks: number;
    inactiveWeeks: number;
  };
  posts: Record<Platform, PostFact[]>;
  text: Record<Platform, TextPost[]>; // posts with text and impressions, the ones we can learn from
  withText: Record<Platform, number>;
  recentPosts: Record<Platform, number>; // known posts in the last 28 days
  scheduled7: Record<Platform, number | null>;
};

const win = (rows: DailyFact[], from: string, to: string) => {
  const r = rows.filter((d) => d.day >= from && d.day <= to && (d.impressions !== null || d.engagements !== null));
  return { imp: sum(r.map((d) => d.impressions ?? 0)), eng: sum(r.map((d) => d.engagements ?? 0)), days: r.length };
};

const combine = (weeks: XWeek[]): XWeek => ({
  week: 0,
  impressions: sum(weeks.map((w) => w.impressions)), likes: sum(weeks.map((w) => w.likes)), comments: sum(weeks.map((w) => w.comments)),
  shares: sum(weeks.map((w) => w.shares)), bookmarks: sum(weeks.map((w) => w.bookmarks)),
});

export function buildContext(input: AdvisoryInput): Ctx {
  const today = input.now.slice(0, 10);
  const daily = [...input.linkedinDaily].sort((a, b) => a.day.localeCompare(b.day));
  const lastDay = daily.length ? daily[daily.length - 1].day : null;

  let last28: Ctx["li"]["last28"] = null, prev28: Ctx["li"]["prev28"] = null, erBaseline: number | null = null;
  let weekday: Ctx["li"]["weekday"] = null, dead: Ctx["li"]["dead"] = null, topShare: number | null = null, weeklyCv: number | null = null;

  if (lastDay) {
    const l = win(daily, addDays(lastDay, -27), lastDay);
    const p = win(daily, addDays(lastDay, -55), addDays(lastDay, -28));
    last28 = l.days >= 14 ? l : null;
    prev28 = p.days >= 14 ? p : null;
    const base = win(daily, addDays(lastDay, -28 - 365), addDays(lastDay, -28));
    erBaseline = base.days >= 60 && base.imp > 0 ? base.eng / base.imp : null;

    const half = daily.filter((d) => d.day >= addDays(lastDay, -181) && d.impressions !== null);
    if (half.length >= 70) {
      const sums = Array(7).fill(0), ns = Array(7).fill(0);
      for (const d of half) { const w = dayOfWeek(d.day); sums[w] += d.impressions!; ns[w]++; }
      if (ns.every((n) => n >= 8)) weekday = { avg: sums.map((s, i) => s / ns[i]), n: ns, overall: mean(half.map((d) => d.impressions!)) };

      // The reference is the average day, not the median: on an account that is quiet most of the time the median day is itself quiet.
      const avg = mean(half.map((d) => d.impressions!));
      const recent = half.filter((d) => d.day >= addDays(lastDay, -55));
      if (avg > 0 && recent.length >= 28) {
        const quiet = recent.filter((d) => d.impressions! < avg * 0.35).length;
        dead = { share: quiet / recent.length, days: quiet, of: recent.length };
      }
      const sorted = half.map((d) => d.impressions!).sort((a, b) => b - a);
      const top = sorted.slice(0, Math.max(1, Math.round(sorted.length * 0.1)));
      const total = sum(sorted);
      topShare = total ? sum(top) / total : null;

      const weeks = new Map<string, number>();
      for (const d of half) {
        const k = addDays(d.day, -((dayOfWeek(d.day) + 6) % 7));
        weeks.set(k, (weeks.get(k) ?? 0) + d.impressions!);
      }
      const full = [...weeks.values()].slice(1, -1); // the edge weeks are cut off
      weeklyCv = full.length >= 12 ? cv(full) : null;
    }
  }

  const xs = [...input.xWeeks].sort((a, b) => a.week - b.week);
  const wk = (a: number, b: number) => xs.filter((w) => w.week >= a && w.week <= b);
  const l4 = wk(1, 4), p4 = wk(5, 8), b8 = wk(5, 12);
  const x: Ctx["x"] = {
    has: xs.length >= 4,
    last4: l4.length === 4 ? combine(l4) : null,
    prev4: p4.length === 4 ? combine(p4) : null,
    base: b8.length >= 4 ? combine(b8) : null,
    baseWeeks: b8.length,
    inactiveWeeks: l4.filter((w) => w.impressions === 0).length,
  };

  const posts: Ctx["posts"] = { linkedin: [], x: [] };
  for (const p of input.posts) posts[p.platform].push(p);
  const mk = (list: PostFact[]): TextPost[] =>
    list.filter((p) => p.content.trim() && (p.impressions ?? 0) > 0).map((p) => {
      const eng = p.engagements ?? (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.clicks ?? 0);
      return { post: p, f: textFeatures(p.content), impressions: p.impressions!, engagements: eng, rate: eng / p.impressions! };
    });
  const cutoff = Date.parse(input.now) - 28 * 86_400_000;
  const recent = (list: PostFact[]) => list.filter((p) => p.publishedAt && Date.parse(p.publishedAt) >= cutoff && Date.parse(p.publishedAt) <= Date.parse(input.now)).length;
  const horizon = Date.parse(input.now) + 7 * 86_400_000;
  const upcoming = (pl: Platform) => (input.scheduled ? input.scheduled.filter((s) => s.platform === pl && Date.parse(s.date) <= horizon).length : null);

  return {
    now: input.now, today, input,
    li: {
      has: daily.length > 0, days: daily.length, lastDay,
      staleDays: lastDay ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDay}T00:00:00Z`)) / 86_400_000) : null,
      last28, prev28, erBaseline, weekday, dead, topShare, weeklyCv,
    },
    x, posts,
    text: { linkedin: mk(posts.linkedin), x: mk(posts.x) },
    withText: { linkedin: posts.linkedin.filter((p) => p.content.trim()).length, x: posts.x.filter((p) => p.content.trim()).length },
    recentPosts: { linkedin: recent(posts.linkedin), x: recent(posts.x) },
    scheduled7: { linkedin: upcoming("linkedin"), x: upcoming("x") },
  };
}

export const liChange = (c: Ctx) => (c.li.last28 && c.li.prev28 ? change(c.li.last28.imp, c.li.prev28.imp) : null);
export const xChange = (c: Ctx) => (c.x.last4 && c.x.prev4 ? change(c.x.last4.impressions, c.x.prev4.impressions) : null);
