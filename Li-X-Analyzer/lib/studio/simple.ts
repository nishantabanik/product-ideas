import { tweetLength } from "./thread.ts";

export const X_MAX = 279;

/** Plain typography: no em or en dashes, straight quotes, no stray spaces. A dash becomes a comma, which keeps the sentence going. */
export function plainText(raw: string): string {
  return raw
    .replace(/\s*[—―]\s*/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/–/g, "-")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch-Kincaid grade level. About 5 reads like a Class 5 school book. Returns null for very short text. */
export function readingGrade(text: string): number | null {
  const words = text.match(/[A-Za-z']+/g) ?? [];
  if (words.length < 12) return null;
  // Every line counts as at least one sentence, because posts are written one short line at a time.
  const sentences = text.split("\n").map((l) => l.trim()).filter(Boolean).reduce((n, l) => n + Math.max(1, (l.match(/[.!?]+(\s|$)/g) ?? []).length), 0);
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  return Math.max(0, +(0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59).toFixed(1));
}

export const GRADE_OK = 6.5;
export const gradeLabel = (g: number | null) => (g == null ? "too short to score" : g <= 4 ? "very easy" : g <= GRADE_OK ? "easy" : g <= 8 ? "a little hard" : "hard");

/** Makes a post fit one X post. Cuts at a sentence, then a word, and never ends in the middle of a word. */
export function fitX(text: string, limit = X_MAX): string {
  const t = plainText(text);
  if (tweetLength(t) <= limit) return t;
  const sentences = t.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (tweetLength(next) > limit) break;
    out = next;
  }
  if (out) return out;
  let cut = "";
  for (const w of t.split(/\s+/)) {
    const next = cut ? `${cut} ${w}` : w;
    if (tweetLength(`${next}...`) > limit) break;
    cut = next;
  }
  return `${cut.replace(/[,;:]$/, "")}...`;
}

export type Issue = { platform: "linkedin" | "x"; problem: string };

/** What is wrong with a written post, in words the model can act on. Empty when it is fine. */
export function checkPost(platform: "linkedin" | "x", text: string, simple = true): Issue[] {
  const out: Issue[] = [];
  if (platform === "x" && tweetLength(text) > X_MAX) out.push({ platform, problem: `It is ${tweetLength(text)} characters. It must be at most 270. Keep only the sharpest idea.` });
  const g = simple ? readingGrade(text) : null;
  if (g != null && g > GRADE_OK + 0.5) out.push({ platform, problem: `The reading level is grade ${g}. Use shorter sentences (under 12 words) and easier, everyday words.` });
  if (/[—–]/.test(text)) out.push({ platform, problem: "It uses a dash. Use a full stop or a comma instead." });
  return out;
}
