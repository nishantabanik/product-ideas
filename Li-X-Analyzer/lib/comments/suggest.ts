import { z } from "zod";
import { llmJson } from "../llm/index.ts";
import type { Platform } from "./types.ts";

const STYLE = "Write plain sentences. No markdown, no asterisks, no em dashes, no hashtags. Never invent facts, numbers or links.";

const Replies = z.object({ replies: z.array(z.object({ tone: z.string(), text: z.string() })) });

/** Three reply options, in different tones, for one comment. */
export async function suggestReplies(o: { platform: Platform; comment: string; author: string; postText: string | null; kind?: "comment" | "dm" }) {
  const limit = o.platform === "x" ? "Every reply must be under 270 characters." : "Replies can be one to three sentences.";
  const r = await llmJson(Replies, {
    system: `You help the owner of a ${o.platform === "x" ? "X" : "LinkedIn"} account answer ${o.kind === "dm" ? "a direct message they received" : "a comment on one of their posts"}. Write as the account owner, in the first person, warm and specific to what the commenter said. Give exactly three options with the tones: short thanks, adds something useful, asks a follow up question. ${limit} ${STYLE}`,
    user: JSON.stringify({ our_post: (o.postText ?? "").slice(0, 1500), comment_author: o.author, comment: o.comment }),
    maxTokens: 1200,
  });
  return r.data.replies.slice(0, 3).map((x) => ({ tone: x.tone, text: o.platform === "x" ? x.text.slice(0, 280) : x.text }));
}

const Extracted = z.object({ comments: z.array(z.object({ author: z.string(), text: z.string(), when: z.string().nullable().optional() })) });

/** For text pasted from a page that is too messy for the simple parser. Only comments that are really there, nothing added. */
export async function extractComments(raw: string) {
  const r = await llmJson(Extracted, {
    system: `You read text copied from the comments section of a social media post and list the comments. Copy each comment's author name and comment text exactly as written. Skip buttons, reaction counts, job titles, connection degrees and the post's own author unless they wrote a comment. If a relative time such as 2d is shown, put it in when, else null. Never add or invent comments. ${STYLE}`,
    user: raw.slice(0, 30_000),
    maxTokens: 6000,
  });
  return r.data.comments.filter((c) => c.text.trim()).map((c) => ({ author: c.author.trim() || "Unknown", body: c.text.trim(), when: c.when ?? null }));
}

const Nudges = z.object({ lines: z.array(z.string()) });

/** Three neutral follow up lines for when no model is connected. */
export function fallbackNudges(platform: Platform): string[] {
  const lines = [
    "Hi, just checking in. Did our answer help?",
    "Wanted to follow up on our chat. Is there anything else we can help with?",
    "No rush at all. If you would like to pick this up again, we are happy to.",
  ];
  return platform === "x" ? lines.map((l) => l.slice(0, 280)) : lines;
}

/** Three short, friendly lines to restart a conversation that went quiet after our reply. */
export async function suggestNudges(o: { platform: Platform; kind: "comment" | "dm"; author: string; theirMessage: string; ourReply: string | null; days: number }) {
  const limit = o.platform === "x" ? "Every line must be under 270 characters." : "Every line is one or two short sentences.";
  const r = await llmJson(Nudges, {
    system: `You help the owner of a ${o.platform === "x" ? "X" : "LinkedIn"} account follow up with someone who has not written back for ${o.days} days after the owner's last reply to their ${o.kind === "dm" ? "message" : "comment"}. Write exactly three short, friendly follow-up lines in the first person. Do not pressure, do not repeat the earlier reply, and offer to help. ${limit} ${STYLE}`,
    user: JSON.stringify({ person: o.author, their_message: o.theirMessage.slice(0, 800), our_last_reply: (o.ourReply ?? "").slice(0, 800) }),
    maxTokens: 800,
  });
  const lines = r.data.lines.map((l) => l.trim()).filter(Boolean).slice(0, 3).map((l) => (o.platform === "x" ? l.slice(0, 280) : l));
  return lines.length ? lines : fallbackNudges(o.platform);
}
