import { median } from "../advisory/stats.ts";
import { textFeatures } from "../advisory/features.ts";
import { PLAYBOOK } from "../advisory/playbook.ts";
import type { Platform, PostFact } from "./types.ts";

export type Voice = { samples: string[]; stats: { posts: number; medianChars: number; medianLines: number; questionShare: number; emojiShare: number; avgHashtags: number } };

/** Who we sound like: our own best posts and the plain measurements of how we write. */
export function buildVoice(posts: PostFact[], platform: Platform, take = 6): Voice {
  const pool = posts.filter((p) => p.platform === platform && p.content.trim().length >= 80);
  const ranked = [...pool].sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0));
  const top = ranked.slice(0, take);
  const feats = pool.map((p) => textFeatures(p.content));
  const share = (f: (x: ReturnType<typeof textFeatures>) => boolean) => (feats.length ? feats.filter(f).length / feats.length : 0);
  return {
    samples: top.map((p) => p.content.trim().slice(0, 900)),
    stats: {
      posts: pool.length,
      medianChars: Math.round(median(feats.map((f) => f.chars))),
      medianLines: Math.round(median(feats.map((f) => f.lines))),
      questionShare: share((f) => f.hasQuestion),
      emojiShare: share((f) => f.emojis > 0),
      avgHashtags: feats.length ? feats.reduce((a, f) => a + f.hashtags, 0) / feats.length : 0,
    },
  };
}

/** The writing brief given to the model: our voice, the rules we follow, and what to avoid. */
export function voiceSystemPrompt(platform: Platform, v: Voice): string {
  const name = platform === "x" ? "X" : "LinkedIn";
  const s = v.stats;
  const rules = PLAYBOOK[platform].do.slice(0, 6).map((r) => `- ${r.title}`).join("\n");
  const avoid = PLAYBOOK[platform].dont.slice(0, 6).map((r) => `- ${r.title}`).join("\n");
  const examples = v.samples.length
    ? `Here are our own best ${name} posts. Match their voice, rhythm and level of detail. Never copy their sentences.\n\n${v.samples.map((t, i) => `Example ${i + 1}:\n${t}`).join("\n\n")}\n\nHow we usually write: about ${s.medianChars} characters, ${s.medianLines} lines, ${Math.round(s.questionShare * 100)}% of posts contain a question, ${Math.round(s.emojiShare * 100)}% use emoji, ${s.avgHashtags.toFixed(1)} hashtags on average.`
    : "We have no past posts to learn from yet, so write in a clear, plain, specific voice.";
  return `You write ${name} posts for one person, in their own voice. Plain words, no corporate language, no hype.\n\n${examples}\n\nPractices to follow:\n${rules}\n\nAvoid:\n${avoid}\n\n${platform === "x" ? "Every X post must be at most 280 characters. Links count as 23." : "Open with a short first line that makes a clear promise. Use short paragraphs."}`;
}
