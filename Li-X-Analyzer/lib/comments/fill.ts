import type { Platform } from "./types.ts";

const TITLES = new Set(["dr", "mr", "mrs", "ms", "mx", "prof", "sir"]);
const NONE = new Set(["unknown", "anonymous", "linkedin member", "someone"]);

/** The first name to greet a person with. Handles @handles, single names, emoji, titles and empty names. Falls back to "there". */
export function firstName(raw: string | null | undefined): string {
  let s = (raw ?? "").normalize("NFC").trim();
  if (!s || NONE.has(s.toLowerCase())) return "there";
  const isHandle = s.startsWith("@");
  s = s.replace(/^@+/, "").replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}‍️]/gu, " ");
  // anything that is not a letter, mark, apostrophe or hyphen separates words (digits, dots, commas, brackets, underscores)
  let parts = s.split(/[^\p{L}\p{M}'’-]+/u).map((p) => p.replace(/^[-'’]+|[-'’]+$/g, "")).filter(Boolean);
  if (!isHandle) while (parts.length > 1 && TITLES.has(parts[0].toLowerCase())) parts.shift();
  const word = parts[0];
  if (!word || word.length < 2 && isHandle) return "there";
  if (!/\p{L}/u.test(word)) return "there";
  const lower = word === word.toLowerCase();
  const upper = word === word.toUpperCase() && word.length > 3;
  if (lower || upper) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

/** A short title for a post: its first line, without links and hashtags, cut at a word near `max` characters. null when there is no text. */
export function postSnippet(content: string | null | undefined, max = 50): string | null {
  const first = (content ?? "").split(/\n/).map((l) => l.replace(/https?:\/\/\S+/g, "").replace(/(^|\s)#\w+/g, "$1").replace(/\s+/g, " ").trim()).find(Boolean);
  if (!first) return null;
  if (first.length <= max) return first.replace(/[.:,;\s]+$/, "");
  const cut = first.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[.:,;\s]+$/, "") + "...";
}

export type Filled = { text: string; length: number; tooLong: boolean; warnings: string[] };

/**
 * Fills [name] and [post] in a template. Other [brackets] stay as they are, and we warn about them so they are not sent by mistake.
 * For X, we warn when the result is longer than 280 characters.
 */
export function fillTemplate(body: string, o: { name?: string | null; post?: string | null; platform: Platform }): Filled {
  const name = firstName(o.name);
  const post = postSnippet(o.post) ?? "our post";
  const text = body.replace(/\[(name|post)\]/gi, (_m, k: string) => (k.toLowerCase() === "name" ? name : post));
  const warnings: string[] = [];
  const left = [...new Set(text.match(/\[[^\]\n]{1,40}\]/g) ?? [])];
  if (left.length) warnings.push(`Fill in ${left.join(", ")} before sending.`);
  const length = text.length;
  const tooLong = o.platform === "x" && length > 280;
  if (tooLong) warnings.push(`This reply has ${length} characters and X allows 280. Shorten it before sending.`);
  return { text, length, tooLong, warnings };
}
