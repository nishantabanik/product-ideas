import { textFeatures } from "./features.ts";
import { rankShare } from "./stats.ts";
import type { Flag, Platform, PostAudit, PostFact } from "./types.ts";

const flag = (key: string, label: string, tone: Flag["tone"]): Flag => ({ key, label, tone });

/** A review of every tracked post: what it looks like, how it did against our other posts, and what to fix. */
export function buildAudits(posts: PostFact[], limit = 400): PostAudit[] {
  const rates: Record<Platform, number[]> = { linkedin: [], x: [] };
  const imprs: Record<Platform, number[]> = { linkedin: [], x: [] };
  const eng = (p: PostFact) => p.engagements ?? (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.clicks ?? 0);
  for (const p of posts) if ((p.impressions ?? 0) > 0) { rates[p.platform].push(eng(p) / p.impressions!); imprs[p.platform].push(p.impressions!); }

  const sorted = [...posts].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).slice(0, limit);
  return sorted.map((p): PostAudit => {
    const text = p.content.trim();
    const hasImpr = (p.impressions ?? 0) > 0;
    const rate = hasImpr ? eng(p) / p.impressions! : null;
    const flags: Flag[] = [];

    if (!text) flags.push(flag("notext", "No text saved", "info"));
    else {
      const f = textFeatures(text);
      const li = p.platform === "linkedin";
      if (f.cliche) flags.push(flag("cliche", "Opens with a cliche", "bad"));
      if (f.bait) flags.push(flag("bait", "Engagement bait", "bad"));
      if (f.hasLink) flags.push(flag("link", "Link in the post", "bad"));
      if (f.hashtags > (li ? 5 : 2)) flags.push(flag("hashtags", "Too many hashtags", "bad"));
      if (li && f.wall) flags.push(flag("wall", "Wall of text", "bad"));
      if (li && f.firstLineChars > 140) flags.push(flag("longhook", "Long first line", "bad"));
      if (f.emojis >= 6) flags.push(flag("emoji", "Emoji heavy", "bad"));
      if (f.mentions >= 3) flags.push(flag("tags", "Many tags", "bad"));
      if (!f.hasQuestion && !f.cta) flags.push(flag("noask", "No question or invitation", "bad"));
      if (f.endsWithQuestion) flags.push(flag("endq", "Ends with a question", "good"));
      if (f.numberInHook) flags.push(flag("number", "Number in the first line", "good"));
      if (li && f.shortLines) flags.push(flag("scan", "Easy to scan", "good"));
      if (f.hasList) flags.push(flag("list", "List format", "good"));
    }

    let score: number | null = null;
    if (hasImpr && rates[p.platform].length >= 2) {
      const r = rankShare(rate!, rates[p.platform]);
      const i = rankShare(p.impressions!, imprs[p.platform]);
      score = Math.round(100 * (0.6 * r + 0.4 * i));
      if (rates[p.platform].length >= 10) {
        if (r >= 0.8) flags.push(flag("toprate", "Top 20% by rate", "good"));
        else if (r <= 0.2) flags.push(flag("lowrate", "Bottom 20% by rate", "bad"));
        if (i >= 0.8) flags.push(flag("topreach", "Top 20% by reach", "good"));
        else if (i <= 0.2) flags.push(flag("lowreach", "Bottom 20% by reach", "bad"));
      }
    }

    return {
      id: p.id, platform: p.platform, snippet: text.replace(/\s+/g, " ").slice(0, 160), url: p.url, date: p.publishedAt,
      impressions: p.impressions, engagements: hasImpr || p.engagements !== null ? eng(p) : null, rate, score, hasText: !!text, flags,
    };
  });
}
