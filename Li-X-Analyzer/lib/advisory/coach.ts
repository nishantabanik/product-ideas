import { llmAvailable, llmJson } from "../llm/index.ts";
import { CoachSchema, type Coach } from "./schema.ts";
import type { Advisory, AdvisoryInput, Platform, PostFact } from "./types.ts";

export const coachConfigured = llmAvailable;

const SYSTEM = `You are a careful social media analyst working for the owner of one LinkedIn account and one X account. You receive measured data, a list of findings from a rules engine, and the text of our best and weakest posts.

Your job is to explain why our results are behind and to give specific advice that raises impressions, engagement, replies, comments and likes.

Rules:
- Use only the numbers in the data. Never invent statistics, benchmarks or follower counts. Say so when the data is thin.
- Be concrete: name the post, the opening line, the day, the change to make. Prefer actions we can finish this week.
- why_behind: three to six causes, strongest first, each tied to something in the data.
- rewrites: pick up to five of the weakest posts that have text. For each, say what is wrong with the opening or structure and give a full rewritten version that keeps the same facts and our voice. Fit the platform: LinkedIn posts can be long with short paragraphs, X posts must stay under 280 characters.
- ideas: five to seven post ideas we can credibly write from the topics we have already posted about, each with a first line.
- experiments: two to four tests with a hypothesis, how to run it for two weeks, and the number to compare.
- watch_out: up to three habits visible in the data that are hurting us.
- Writing style: plain sentences. No markdown, no bullet symbols, no asterisks, no em dashes. Write as we and our, never you.`;

type Brief = { date: string | null; text: string; impressions: number | null; engagementRatePct: number | null; flags: string[] };

function brief(p: PostFact, a: Advisory): Brief {
  const au = a.audits.find((x) => x.id === p.id);
  return {
    date: p.publishedAt?.slice(0, 10) ?? null,
    text: p.content.replace(/\s+/g, " ").trim().slice(0, 600),
    impressions: p.impressions,
    engagementRatePct: au?.rate != null ? Math.round(au.rate * 10000) / 100 : null,
    flags: au?.flags.map((f) => f.label) ?? [],
  };
}

export function buildCoachDigest(a: Advisory, input: AdvisoryInput) {
  const pick = (platform: Platform) => {
    const withText = input.posts.filter((p) => p.platform === platform && p.content.trim() && (p.impressions ?? 0) > 0);
    const score = (p: PostFact) => a.audits.find((x) => x.id === p.id)?.score ?? 50;
    const sorted = [...withText].sort((x, y) => score(y) - score(x));
    return { postsWithText: withText.length, best: sorted.slice(0, 8).map((p) => brief(p, a)), weakest: sorted.slice(-8).reverse().map((p) => brief(p, a)) };
  };
  return {
    today: a.day,
    headline: a.headline,
    scores: { linkedin: a.scores.linkedin, x: a.scores.x },
    numbers: a.digest,
    findings: a.findings.slice(0, 16).map((f) => ({ platform: f.platform, group: f.group, severity: f.severity, title: f.title, why: f.why })),
    linkedinPosts: pick("linkedin"),
    xPosts: pick("x"),
  };
}

export type CoachResult = { coach: Coach; model: string; usage: { input: number; output: number } | null };

/** One call to our model per day. Fails with a readable message, never silently. */
export async function runCoach(a: Advisory, input: AdvisoryInput): Promise<CoachResult> {
  const r = await llmJson(CoachSchema, { system: SYSTEM, user: JSON.stringify(buildCoachDigest(a, input)), maxTokens: 6000 });
  return { coach: r.data, model: r.model, usage: r.usage ?? null };
}
