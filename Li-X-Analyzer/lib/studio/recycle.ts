import { median } from "../advisory/stats.ts";
import type { PostFact } from "./types.ts";

const TIME_BOUND = /\b(today|tomorrow|tonight|this (week|weekend|month)|next (week|month)|webinar|register|join us|deadline|ends (today|soon)|sale|limited time|20\d\d|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2})\b/i;

export type Candidate = { post: PostFact; ageDays: number; ratio: number; reason: string };

/**
 * Old posts worth running again: well above the typical post, old enough that most of our audience has moved on, not tied to a
 * date, and not already recycled recently.
 */
export function evergreenCandidates(posts: PostFact[], now: Date, recycledPostIds: Iterable<string> = [], minAgeDays = 90, limit = 10): Candidate[] {
  const recycled = new Set(recycledPostIds);
  const out: Candidate[] = [];
  for (const platform of ["linkedin", "x"] as const) {
    const pool = posts.filter((p) => p.platform === platform && (p.impressions ?? 0) > 0);
    if (pool.length < 8) continue;
    const typical = median(pool.map((p) => p.impressions!));
    for (const p of pool) {
      if (!p.publishedAt || recycled.has(p.id)) continue;
      const text = p.content.trim();
      if (text.length < 60 || TIME_BOUND.test(text)) continue;
      const ageDays = (now.getTime() - new Date(p.publishedAt).getTime()) / 86_400_000;
      if (ageDays < minAgeDays) continue;
      const ratio = p.impressions! / typical;
      if (ratio < 1.3) continue;
      out.push({ post: p, ageDays: Math.round(ageDays), ratio, reason: `${ratio.toFixed(1)} times our typical ${platform === "x" ? "X" : "LinkedIn"} post, ${Math.round(ageDays / 30)} months ago, not tied to a date.` });
    }
  }
  return out.sort((a, b) => b.ratio - a.ratio).slice(0, limit);
}
