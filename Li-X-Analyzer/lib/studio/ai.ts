import { z } from "zod";
import { llmAvailable, llmJson } from "../llm";
import { lintDraft } from "./lint.ts";
import { splitThread } from "./thread.ts";
import { buildVoice, voiceSystemPrompt } from "./voice.ts";
import type { Pillar } from "./pillars.ts";
import type { Platform, PostFact } from "./types.ts";

export const NO_MODEL = "No model is connected. Add a gateway or sign in with GitHub Copilot on the Settings page.";
const need = async () => { if (!(await llmAvailable())) throw new Error(NO_MODEL); };

const Variants = z.object({ variants: z.array(z.object({ angle: z.string().describe("a few words naming the angle of this version"), text: z.string(), thread: z.array(z.string()).optional() })).min(1).max(3) });
export type Variant = z.infer<typeof Variants>["variants"][number];

/** Three versions of a post in our own voice, each checked against the same rules as the Advisory. */
export async function draftVariants(o: { platform: Platform; brief: string; pillar?: string; hook?: string; asThread?: boolean; posts: PostFact[] }) {
  await need();
  const voice = buildVoice(o.posts, o.platform);
  const user = [
    `Write three different versions of one ${o.platform === "x" ? "X" : "LinkedIn"} post.`,
    `What the post is about: ${o.brief}`,
    o.pillar ? `Content pillar: ${o.pillar}` : "",
    o.hook ? `Start from this opening pattern, filled in with real content: ${o.hook}` : "",
    o.platform === "x" && o.asThread ? "Write each version as a thread: put every post in the thread array (the first one must make a strong promise), and also put the first post in text." : "",
    "Each version takes a different angle. Do not invent facts, numbers or names that are not in the brief. Use brackets like [number] where a real detail is missing.",
  ].filter(Boolean).join("\n");
  const r = await llmJson(Variants, { system: voiceSystemPrompt(o.platform, voice), user, maxTokens: 3000 });
  return r.data.variants.map((v) => ({ ...v, lint: lintDraft(o.platform, v.text, v.thread ?? []) }));
}

const Repurposed = z.object({ linkedin: z.string(), xShort: z.string(), xThread: z.array(z.string()).min(2) });
export type Repurposed = z.infer<typeof Repurposed>;

/** One post becomes a LinkedIn version, a short X post and an X thread. Without a model we cut it up by rule. */
export async function repurpose(o: { text: string; from: Platform; posts: PostFact[] }): Promise<Repurposed & { via: "model" | "rules" }> {
  const rules = (): Repurposed & { via: "rules" } => {
    const t = o.text.trim();
    const first = t.split(/\n{2,}/)[0] ?? t;
    return { linkedin: t, xShort: first.length <= 280 ? first : `${first.slice(0, 276).replace(/\s+\S*$/, "")}...`, xThread: splitThread(t, 280, true).length > 1 ? splitThread(t, 280, true) : [first, t.slice(first.length).trim() || first], via: "rules" };
  };
  if (!(await llmAvailable())) return rules();
  try {
    const voice = buildVoice(o.posts, "linkedin");
    const r = await llmJson(Repurposed, {
      system: voiceSystemPrompt("linkedin", voice) + "\n\nYou adapt one post into other formats without adding new claims.",
      user: `Adapt this ${o.from === "x" ? "X" : "LinkedIn"} post.\n- linkedin: a LinkedIn version with a strong first line and short paragraphs.\n- xShort: one X post of at most 280 characters with the single sharpest point.\n- xThread: an X thread of 3 to 8 posts, each at most 280 characters, the first one makes the promise.\n\nPost:\n${o.text}`,
      maxTokens: 3000,
    });
    return { ...r.data, via: "model" };
  } catch {
    return rules();
  }
}

const Ideas = z.object({ ideas: z.array(z.object({ title: z.string(), angle: z.string(), pillar: z.string().optional() })).min(3).max(12) });

export async function generateIdeas(o: { platform: Platform; pillars: Pillar[]; posts: PostFact[]; count: number }) {
  await need();
  const best = [...o.posts].filter((p) => p.platform === o.platform && (p.impressions ?? 0) > 0).sort((a, b) => b.impressions! - a.impressions!).slice(0, 8)
    .map((p) => `- ${p.content.trim().split("\n")[0].slice(0, 140)}`).join("\n");
  const r = await llmJson(Ideas, {
    system: "You suggest post ideas for one person's LinkedIn and X accounts. Ideas must be specific and based on real experience the author could have, not generic tips.",
    user: `Suggest ${o.count} post ideas for ${o.platform === "x" ? "X" : "LinkedIn"}.\nContent pillars: ${o.pillars.map((p) => p.name).join(", ") || "none set yet"}\nOur best past openings, for what already works with our audience:\n${best || "(none yet)"}\nGive each idea a short title, one line on the angle, and the pillar it belongs to if any.`,
    maxTokens: 1800,
  });
  return r.data.ideas;
}

const Improved = z.object({ text: z.string(), thread: z.array(z.string()).optional(), changes: z.array(z.string()) });
export async function improveDraft(o: { platform: Platform; text: string; thread?: string[]; issues: string[]; posts: PostFact[] }) {
  await need();
  const r = await llmJson(Improved, {
    system: voiceSystemPrompt(o.platform, buildVoice(o.posts, o.platform)),
    user: `Improve this draft without changing its meaning or adding facts. Fix these problems:\n${o.issues.map((i) => `- ${i}`).join("\n") || "- make it sharper"}\n\n${o.thread && o.thread.length > 1 ? `Thread posts:\n${o.thread.map((t, i) => `${i + 1}. ${t}`).join("\n")}\nReturn the improved posts in thread and the first one in text.` : `Draft:\n${o.text}`}\n\nList what you changed in changes.`,
    maxTokens: 2500,
  });
  return { ...r.data, lint: lintDraft(o.platform, r.data.text, r.data.thread ?? []) };
}

const Fresh = z.object({ text: z.string() });
/** An old winner with a new opening, same substance. */
export async function refreshOld(o: { platform: Platform; text: string; posts: PostFact[] }) {
  await need();
  const r = await llmJson(Fresh, {
    system: voiceSystemPrompt(o.platform, buildVoice(o.posts, o.platform)),
    user: `This post did well a while ago. Write it again for today: a new first line and a fresh angle, same substance, no new facts, and not a copy of the old wording.\n\n${o.text}`,
    maxTokens: 1500,
  });
  return r.data.text;
}
