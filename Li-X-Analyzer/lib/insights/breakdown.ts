import { lengthBucket, textFeatures } from "../advisory/features.ts";
import { median } from "../advisory/stats.ts";
import { pillarOf, type Pillar } from "../studio/pillars.ts";

/**
 * Content analysis: how topic, format, length and hook of a post relate to its impressions.
 * Only posts that have text and impressions can be analysed. Everything here is deterministic.
 */
export type BreakdownPost = {
  id: string;
  platform: "linkedin" | "x";
  content: string;
  impressions: number | null;
  engagements: number | null;
};

export const MIN_GROUP = 4;
export const MIN_OVERALL = 8;
export const STRONG = 1.25;
export const WEAK = 0.75;

export type Verdict = "strong" | "average" | "weak" | "too few posts";

export function verdictFor(groupPosts: number, overallPosts: number, ratio: number | null): Verdict {
  if (groupPosts < MIN_GROUP || overallPosts < MIN_OVERALL || ratio === null) return "too few posts";
  if (ratio >= STRONG) return "strong";
  if (ratio <= WEAK) return "weak";
  return "average";
}

/* ---------- detectors ---------- */

export type Format = "thread" | "list" | "question" | "story" | "single";
export const FORMAT_LABEL: Record<Format, string> = { thread: "Thread", list: "List", question: "Question post", story: "Story", single: "Single post" };

const NOT_PAST = new Set(["need", "speed", "seed", "feed", "bleed", "breed", "indeed", "proceed", "succeed", "exceed", "weed", "deed", "heed", "reed", "hundred", "embed", "tweed", "creed", "greed", "sled", "shed", "bed", "red", "led", "fed", "wed"]);
const IRREGULAR = /\b(was|were|had|did|got|learned|learnt|told|made|took|went|said|lost|built|began|quit|knew|felt|left|met|thought|saw|came|found|ran|wrote|paid|sold|bought|spent|kept|gave|heard|woke|fell|grew)\b/i;

function hasPastTense(text: string) {
  if (IRREGULAR.test(text)) return true;
  for (const m of text.toLowerCase().matchAll(/\b[a-z]{2,}ed\b/g)) if (!NOT_PAST.has(m[0])) return true;
  return false;
}

/**
 * Format rules, checked in this order, first match wins:
 * thread: a thread emoji anywhere, a line starting with "1/" or "1/5", or the word "thread" in the first line.
 * list: three or more lines that start with a bullet or a number ("1." or "2)").
 * question: the post ends with a question mark.
 * story: the first line starts with "I " or "We " (also I'm, we've) and the text has a past tense word.
 * single: everything else.
 */
export function detectFormat(raw: string): Format {
  const text = raw.replace(/\r/g, "").trim();
  const f = textFeatures(text);
  if (/🧵/.test(text) || /(^|\n)\s*\(?1\/\d*\)?(\s|[.:]|$)/.test(text) || /\bthread\b/i.test(f.firstLine)) return "thread";
  if (f.hasList) return "list";
  if (f.endsWithQuestion) return "question";
  if (/^(i|we)(['’](m|ve|d|re|ll))?\s/i.test(f.firstLine) && hasPastTense(text)) return "story";
  return "single";
}

export type Hook = "number" | "question" | "claim" | "personal" | "howto" | "other";
export const HOOK_LABEL: Record<Hook, string> = {
  number: "Starts with a number", question: "Opens with a question", claim: "Bold claim or negation",
  personal: "Personal (I or We)", howto: "How to", other: "Other",
};

const CLAIM = /^(most|stop|never|nobody|no one|everyone|everybody|you (don['’]t|do not|are wrong|should(n['’]t| not))|don['’]t|do not|forget|unpopular opinion|hot take|the (biggest|worst|truth|real)|there is no|there['’]s no|stop|quit)\b/i;
const PERSONAL = /^(i|we|my|our)(['’](m|ve|d|re|ll))?(\s|$)/i;
const HOWTO = /^(how to|here['’]?s how|here is how|a (simple )?guide to|step[- ]by[- ]step)\b/i;

/**
 * Hook rules on the first line (leading emoji, quotes and hashes ignored), first match wins:
 * number: starts with a digit. howto: "How to", "Here's how". question: the first line has a question mark.
 * claim: starts with "Most", "Stop", "Never", "Nobody", "Don't", "Unpopular opinion" and similar.
 * personal: starts with I, We, My or Our. other: anything else.
 */
export function detectHook(raw: string): Hook {
  const first = textFeatures(raw).firstLine.replace(/^[^\p{L}\p{N}]+/u, "");
  if (!first) return "other";
  if (/^\d/.test(first)) return "number";
  if (HOWTO.test(first)) return "howto";
  if (first.includes("?")) return "question";
  if (CLAIM.test(first)) return "claim";
  if (PERSONAL.test(first)) return "personal";
  return "other";
}

export const LENGTH_RANGE: Record<"linkedin" | "x", Record<"short" | "medium" | "long", string>> = {
  linkedin: { short: "under 500 characters", medium: "500 to 1,500 characters", long: "over 1,500 characters" },
  x: { short: "under 100 characters", medium: "100 to 200 characters", long: "over 200 characters" },
};

/* ---------- breakdown ---------- */

export type Group = {
  key: string;
  label: string;
  detail: string | null;
  posts: number;
  medianImpressions: number;
  medianRate: number | null; // engagements / impressions, 0 to 1
  ratio: number | null; // median impressions / platform median
  verdict: Verdict;
};

export type DimensionId = "topic" | "format" | "length" | "hook";
export type Dimension = { id: DimensionId; title: string; groups: Group[] };

export type Breakdown = {
  platform: "linkedin" | "x";
  total: number; // posts of this platform in the input
  withoutText: number;
  withoutImpressions: number; // has text, but no impressions (or zero)
  usable: number;
  overallMedian: number;
  overallRate: number | null;
  enough: boolean; // at least MIN_OVERALL usable posts
  dimensions: Dimension[];
  standouts: string[];
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const times = (r: number) => `${r.toFixed(1)} times`;

function makeGroup(key: string, label: string, detail: string | null, list: BreakdownPost[], overallMedian: number, usable: number): Group {
  const imps = list.map((p) => p.impressions!);
  const rates = list.filter((p) => p.engagements != null).map((p) => p.engagements! / p.impressions!);
  const med = median(imps);
  const ratio = overallMedian > 0 ? med / overallMedian : null;
  return { key, label, detail, posts: list.length, medianImpressions: med, medianRate: rates.length ? median(rates) : null, ratio, verdict: verdictFor(list.length, usable, ratio) };
}

export function breakdown(posts: BreakdownPost[], pillars: Pillar[], platform: "linkedin" | "x"): Breakdown {
  const mine = posts.filter((p) => p.platform === platform);
  const withText = mine.filter((p) => (p.content ?? "").trim().length > 0);
  const usablePosts = withText.filter((p) => (p.impressions ?? 0) > 0);
  const usable = usablePosts.length;
  const overallMedian = median(usablePosts.map((p) => p.impressions!));
  const rates = usablePosts.filter((p) => p.engagements != null).map((p) => p.engagements! / p.impressions!);
  const overallRate = rates.length ? median(rates) : null;

  const by = (classify: (p: BreakdownPost) => string) => {
    const m = new Map<string, BreakdownPost[]>();
    for (const p of usablePosts) { const k = classify(p); m.set(k, [...(m.get(k) ?? []), p]); }
    return m;
  };
  const sortGroups = (gs: Group[]) => gs.sort((a, b) => b.medianImpressions - a.medianImpressions || b.posts - a.posts || a.label.localeCompare(b.label));
  const build = (m: Map<string, BreakdownPost[]>, label: (k: string) => string, detail: (k: string) => string | null, order?: string[]) => {
    const gs = [...m].map(([k, l]) => makeGroup(k, label(k), detail(k), l, overallMedian, usable));
    if (order) return gs.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    return sortGroups(gs);
  };

  const pillarName = new Map(pillars.map((p) => [p.id, p.name]));
  const topic = build(by((p) => pillarOf(p.content, pillars)?.id ?? "untagged"), (k) => pillarName.get(k) ?? "Untagged", () => null);
  // Untagged always last so the named topics read first.
  topic.sort((a, b) => (a.key === "untagged" ? 1 : 0) - (b.key === "untagged" ? 1 : 0));
  const format = build(by((p) => detectFormat(p.content)), (k) => FORMAT_LABEL[k as Format], () => null, ["single", "thread", "list", "question", "story"]);
  const length = build(by((p) => lengthBucket(platform, textFeatures(p.content).chars)), (k) => k[0].toUpperCase() + k.slice(1), (k) => LENGTH_RANGE[platform][k as "short"], ["short", "medium", "long"]);
  const hook = build(by((p) => detectHook(p.content)), (k) => HOOK_LABEL[k as Hook], () => null, ["number", "howto", "question", "claim", "personal", "other"]);

  const dimensions: Dimension[] = [
    { id: "topic", title: "Topic", groups: topic },
    { id: "format", title: "Format", groups: format },
    { id: "length", title: "Length", groups: length },
    { id: "hook", title: "Hook", groups: hook },
  ];

  return {
    platform, total: mine.length, withoutText: mine.length - withText.length, withoutImpressions: withText.length - usable,
    usable, overallMedian, overallRate, enough: usable >= MIN_OVERALL, dimensions, standouts: standouts(dimensions, usable),
  };
}

const DIM_WORD: Record<DimensionId, string> = { topic: "topic", format: "format", length: "length", hook: "hook" };

/** At most 3 sentences, built only from well supported groups. Nothing when the evidence is thin. */
export function standouts(dimensions: Dimension[], usable: number): string[] {
  if (usable < MIN_OVERALL) return [];
  const all = dimensions.flatMap((d) => d.groups.filter((g) => g.ratio !== null && (g.verdict === "strong" || g.verdict === "weak")).map((g) => ({ d, g })));
  const strong = all.filter((x) => x.g.verdict === "strong").sort((a, b) => b.g.ratio! - a.g.ratio!);
  const weak = all.filter((x) => x.g.verdict === "weak").sort((a, b) => a.g.ratio! - b.g.ratio!);
  const out: string[] = [];
  const say = ({ d, g }: { d: Dimension; g: Group }) => {
    const who = d.id === "length" ? `Our ${g.label.toLowerCase()} posts` : `Posts with the ${DIM_WORD[d.id]} "${g.label}"`;
    return g.verdict === "strong"
      ? `${who} reach ${times(g.ratio!)} the typical impressions (${g.posts} posts, median ${fmt(g.medianImpressions)}).`
      : `${who} reach only ${Math.round(g.ratio! * 100)}% of the typical impressions (${g.posts} posts, median ${fmt(g.medianImpressions)}).`;
  };
  for (const s of strong.slice(0, 2)) out.push(say(s));
  if (weak[0]) out.push(say(weak[0]));
  else if (strong[2] && out.length < 3) out.push(say(strong[2]));
  return out.slice(0, 3);
}
