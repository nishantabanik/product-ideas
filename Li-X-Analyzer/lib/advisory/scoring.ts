import { liChange, xChange, type Ctx } from "./context.ts";
import { clamp, pct } from "./stats.ts";
import type { Score, ScorePart } from "./types.ts";

const label = (n: number): Score["label"] => (n >= 75 ? "Strong" : n >= 55 ? "Okay" : "Needs work");

function overall(parts: (ScorePart & { weight: number })[]): Score | null {
  if (!parts.length) return null;
  const w = parts.reduce((a, p) => a + p.weight, 0);
  const n = Math.round(parts.reduce((a, p) => a + p.score * p.weight, 0) / w);
  return { overall: n, label: label(n), parts: parts.map(({ label: l, score, note }) => ({ label: l, score: Math.round(score), note })) };
}

const trend = (changePct: number) => clamp(60 + changePct * 1.2);

export function linkedinScore(c: Ctx): Score | null {
  if (!c.li.has) return null;
  const parts: (ScorePart & { weight: number })[] = [];
  const ch = liChange(c);
  if (ch !== null) parts.push({ label: "Reach trend", weight: 0.35, score: trend(ch), note: `${ch >= 0 ? "+" : ""}${ch.toFixed(0)}% impressions vs the previous 4 weeks` });

  if (c.li.last28 && c.li.erBaseline && c.li.last28.imp > 0) {
    const er = c.li.last28.eng / c.li.last28.imp;
    const ratio = er / c.li.erBaseline;
    parts.push({ label: "Engagement quality", weight: 0.25, score: clamp(60 + (ratio - 1) * 100), note: `${pct(er * 100, 2)} engagement rate, our usual is ${pct(c.li.erBaseline * 100, 2)}` });
  }

  if (c.li.dead || c.li.weeklyCv !== null) {
    const dead = c.li.dead ? c.li.dead.share * 100 : 0;
    const swing = c.li.weeklyCv !== null ? Math.min(25, c.li.weeklyCv * 20) : 0;
    parts.push({ label: "Consistency", weight: 0.25, score: clamp(100 - dead - swing), note: c.li.dead ? `${c.li.dead.days} of ${c.li.dead.of} recent days were very quiet` : "Weekly reach swings" });
  }

  let pipe = c.li.staleDays === null ? 50 : c.li.staleDays <= 3 ? 100 : c.li.staleDays <= 10 ? 80 : c.li.staleDays <= 30 ? 50 : 20;
  const notes = [c.li.staleDays !== null ? `data is ${c.li.staleDays} days old` : "no data"];
  if (c.scheduled7.linkedin !== null) {
    pipe += c.scheduled7.linkedin === 0 ? -25 : c.scheduled7.linkedin >= 3 ? 0 : -10;
    notes.push(`${c.scheduled7.linkedin} scheduled in the next 7 days`);
  }
  parts.push({ label: "Freshness and queue", weight: 0.15, score: clamp(pipe), note: notes.join(", ") });
  return overall(parts);
}

export function xScore(c: Ctx): Score | null {
  if (!c.x.has) return null;
  const parts: (ScorePart & { weight: number })[] = [];
  const ch = xChange(c);
  if (ch !== null) parts.push({ label: "Reach trend", weight: 0.35, score: trend(ch), note: `${ch >= 0 ? "+" : ""}${ch.toFixed(0)}% impressions vs the previous 4 weeks` });

  const l = c.x.last4;
  if (l && l.impressions >= 200) {
    const total = l.likes + l.comments + l.shares;
    const share = total ? l.comments / total : 0;
    const shareScore = clamp(20 + share * 100 * 5.3);
    let score = shareScore;
    let note = `Replies are ${Math.round(share * 100)}% of interactions`;
    const b = c.x.base;
    if (b && b.impressions > 200) {
      const [now, base] = [(l.comments + l.likes) / l.impressions, (b.comments + b.likes) / b.impressions];
      if (base > 0) { score = (shareScore + clamp(60 + (now / base - 1) * 100)) / 2; note += `, replies and likes per view ${now >= base ? "up" : "down"} ${Math.abs(Math.round((now / base - 1) * 100))}%`; }
    }
    parts.push({ label: "Conversation", weight: 0.3, score, note });
  }

  parts.push({
    label: "Consistency", weight: 0.2,
    score: clamp(100 - c.x.inactiveWeeks * 30 - (c.posts.x.length > 0 && c.recentPosts.x < 12 ? 15 : 0)),
    note: c.x.inactiveWeeks ? `${c.x.inactiveWeeks} of the last 4 weeks had no impressions` : "Every recent week had impressions",
  });

  if (c.scheduled7.x !== null) {
    const n = c.scheduled7.x;
    parts.push({ label: "Queue", weight: 0.15, score: n === 0 ? 30 : n < 5 ? 70 : 100, note: `${n} scheduled in the next 7 days` });
  }
  return overall(parts);
}
