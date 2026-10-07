import { median } from "../advisory/stats.ts";
import type { PostFact } from "./types.ts";

export type Pillar = { id: string; name: string; keywords: string[] };

const norm = (s: string) => s.toLowerCase();

/** The first pillar whose keyword appears in the text (whole word, or a phrase). Posts that match none stay untagged. */
export function pillarOf(text: string, pillars: Pillar[]): Pillar | null {
  const t = ` ${norm(text).replace(/[^\p{L}\p{N}#@' ]+/gu, " ")} `;
  let best: { p: Pillar; hits: number } | null = null;
  for (const p of pillars) {
    const hits = p.keywords.filter((k) => k.trim() && t.includes(` ${norm(k.trim())}`)).length;
    if (hits && (!best || hits > best.hits)) best = { p, hits };
  }
  return best?.p ?? null;
}

export type PillarStat = { id: string | null; name: string; posts: number; medianImpressions: number | null; medianRate: number | null; likes: number; comments: number; verdict: "strong" | "average" | "weak" | "few posts" };

/** How each content pillar performs, compared with the typical post. */
export function pillarStats(posts: PostFact[], pillars: Pillar[]): PillarStat[] {
  const withNum = posts.filter((p) => (p.impressions ?? 0) > 0);
  const typical = median(withNum.map((p) => p.impressions!));
  const groups = new Map<string | null, PostFact[]>();
  for (const p of posts) {
    const id = pillarOf(p.content, pillars)?.id ?? null;
    groups.set(id, [...(groups.get(id) ?? []), p]);
  }
  const rows: PillarStat[] = [];
  for (const [id, list] of groups) {
    const imp = list.filter((p) => (p.impressions ?? 0) > 0).map((p) => p.impressions!);
    const rate = list.filter((p) => (p.impressions ?? 0) > 0 && p.engagements != null).map((p) => (p.engagements! / p.impressions!) * 100);
    const mi = imp.length ? median(imp) : null;
    rows.push({
      id, name: id ? pillars.find((p) => p.id === id)!.name : "Untagged",
      posts: list.length, medianImpressions: mi, medianRate: rate.length ? median(rate) : null,
      likes: list.reduce((a, p) => a + (p.likes ?? 0), 0), comments: list.reduce((a, p) => a + (p.comments ?? 0), 0),
      verdict: imp.length < 3 || !typical ? "few posts" : mi! >= typical * 1.25 ? "strong" : mi! <= typical * 0.75 ? "weak" : "average",
    });
  }
  return rows.sort((a, b) => (b.medianImpressions ?? -1) - (a.medianImpressions ?? -1));
}
