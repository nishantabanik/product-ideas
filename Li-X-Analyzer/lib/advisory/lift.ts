import { median } from "./stats.ts";
import { lengthBucket, type Features } from "./features.ts";
import type { TextPost } from "./context.ts";
import type { Platform } from "./types.ts";

type Def = { key: string; label: string; test: (f: Features, p: Platform) => boolean; only?: Platform };

/** Traits a post can have. The label finishes the sentence "Posts that ...". */
export const TRAITS: Def[] = [
  { key: "question", label: "ask a question", test: (f) => f.hasQuestion },
  { key: "endsQuestion", label: "end with a question", test: (f) => f.endsWithQuestion },
  { key: "cta", label: "invite a reply or share", test: (f) => f.cta },
  { key: "link", label: "contain a link", test: (f) => f.hasLink },
  { key: "hashtags", label: "use many hashtags", test: (f, p) => f.hashtags > (p === "x" ? 1 : 3) },
  { key: "number", label: "have a number in the first line", test: (f) => f.numberInHook },
  { key: "list", label: "are written as a list", test: (f) => f.hasList },
  { key: "shortLines", label: "use short lines", test: (f) => f.shortLines, only: "linkedin" },
  { key: "long", label: "are long", test: (f, p) => lengthBucket(p, f.chars) === "long" },
  { key: "short", label: "are short", test: (f, p) => lengthBucket(p, f.chars) === "short" },
  { key: "emoji", label: "use many emojis", test: (f) => f.emojis >= 4 },
  { key: "mentions", label: "tag several people", test: (f) => f.mentions >= 2 },
  { key: "thread", label: "are threads", test: (f) => f.thread, only: "x" },
  { key: "longHook", label: "start with a long first line", test: (f) => f.firstLineChars > 140, only: "linkedin" },
  { key: "bait", label: "use engagement bait", test: (f) => f.bait },
  { key: "cliche", label: "open with a cliche", test: (f) => f.cliche },
];

export type LiftRow = {
  key: string;
  label: string;
  withN: number;
  withoutN: number;
  rateWith: number;
  rateWithout: number;
  imprWith: number;
  imprWithout: number;
  rateLift: number; // relative, 0.3 means 30 percent higher
  imprLift: number;
  solid: boolean; // enough posts on both sides to trust it more
};

const weighted = (ps: TextPost[]) => {
  const imp = ps.reduce((a, p) => a + p.impressions, 0);
  return imp ? ps.reduce((a, p) => a + p.engagements, 0) / imp : 0;
};

/** For every trait with enough posts on both sides, how do posts with it compare to posts without it. */
export function liftTable(posts: TextPost[], platform: Platform, minEach = 4): LiftRow[] {
  const out: LiftRow[] = [];
  for (const t of TRAITS) {
    if (t.only && t.only !== platform) continue;
    const w = posts.filter((p) => t.test(p.f, platform));
    const wo = posts.filter((p) => !t.test(p.f, platform));
    if (w.length < minEach || wo.length < minEach) continue;
    const [rw, rwo] = [weighted(w), weighted(wo)];
    const [iw, iwo] = [median(w.map((p) => p.impressions)), median(wo.map((p) => p.impressions))];
    out.push({
      key: t.key, label: t.label, withN: w.length, withoutN: wo.length, rateWith: rw, rateWithout: rwo, imprWith: iw, imprWithout: iwo,
      rateLift: rwo ? rw / rwo - 1 : 0, imprLift: iwo ? iw / iwo - 1 : 0, solid: w.length >= 10 && wo.length >= 10,
    });
  }
  return out;
}

/** Traits that show up much more often among our best posts than among all posts. */
export function commonTraits(posts: TextPost[], platform: Platform, topN = 5) {
  if (posts.length < 12) return [];
  const best = [...posts].sort((a, b) => b.rate - a.rate).slice(0, topN);
  const out: { key: string; label: string; inBest: number; inAll: number }[] = [];
  for (const t of TRAITS) {
    if (t.only && t.only !== platform) continue;
    const a = best.filter((p) => t.test(p.f, platform)).length / best.length;
    const b = posts.filter((p) => t.test(p.f, platform)).length / posts.length;
    if (a >= 0.6 && a - b >= 0.3) out.push({ key: t.key, label: t.label, inBest: a, inAll: b });
  }
  return out;
}
