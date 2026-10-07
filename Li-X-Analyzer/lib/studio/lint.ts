import { textFeatures } from "../advisory/features.ts";
import { tweetLength, X_LIMIT } from "./thread.ts";
import type { Platform } from "./types.ts";

export type Check = { key: string; level: "ok" | "warn" | "bad"; label: string; tip: string };
export type Lint = { score: number; checks: Check[] };

const PENALTY = { ok: 0, warn: 8, bad: 18 } as const;

/** Checks a draft against the same practices the Advisory uses, so every post is reviewed before it goes out. */
export function lintDraft(platform: Platform, text: string, thread: string[] = []): Lint {
  const posts = platform === "x" && thread.length > 1 ? thread : [text];
  const whole = posts.join("\n\n");
  const f = textFeatures(whole);
  const checks: Check[] = [];
  const add = (key: string, level: Check["level"], label: string, tip: string) => checks.push({ key, level, label, tip });
  if (!whole.trim()) return { score: 0, checks: [{ key: "empty", level: "bad", label: "Nothing written yet", tip: "Write the first line, it decides whether anyone reads on." }] };

  const first = textFeatures(posts[0]).firstLine;
  if (platform === "linkedin") {
    add("hook", first.length <= 140 ? "ok" : first.length <= 220 ? "warn" : "bad", first.length <= 140 ? "Short opening line" : "Long opening line", "Only the first two lines show before see more. Make the first line carry the promise.");
    add("length", f.chars >= 300 && f.chars <= 1800 ? "ok" : "warn", f.chars < 300 ? "Very short for LinkedIn" : f.chars > 1800 ? "Very long for LinkedIn" : "Good length", "Most strong LinkedIn posts run 500 to 1500 characters.");
    add("link", f.hasLink ? "warn" : "ok", f.hasLink ? "Link in the main post" : "No link in the post", "Posts with outbound links are often shown to fewer people. Put the link in the first comment and test it.");
    add("wall", f.wall ? "bad" : f.shortLines || f.lines >= 4 ? "ok" : "warn", f.wall ? "Wall of text" : "Easy to scan", "Use short paragraphs of one or two lines with white space between them.");
    add("hashtags", f.hashtags <= 3 ? "ok" : "warn", f.hashtags <= 3 ? "Hashtags are in check" : `${f.hashtags} hashtags`, "Use three or fewer relevant hashtags.");
  } else {
    const worst = Math.max(...posts.map(tweetLength));
    add("limit", worst <= X_LIMIT ? "ok" : "bad", worst <= X_LIMIT ? "Fits the limit" : `A post is ${worst} characters`, `Each X post can hold ${X_LIMIT} characters, links count as 23.`);
    add("hook", textFeatures(posts[0]).firstLineChars <= 100 || tweetLength(posts[0]) <= 140 ? "ok" : "warn", "First post makes the promise", "The first post is what gets shown. Lead with the result, the surprise or the problem.");
    add("link", f.hasLink ? "warn" : "ok", f.hasLink ? "Link in the post" : "No link in the post", "Links can lower reach on X. Put it in a reply to our own post and test the difference.");
    add("hashtags", f.hashtags <= 2 ? "ok" : "warn", f.hashtags <= 2 ? "Hashtags are in check" : `${f.hashtags} hashtags`, "One or two hashtags at most on X.");
    if (posts.length > 1) add("thread", posts.length <= 12 ? "ok" : "warn", `Thread of ${posts.length} posts`, "Threads that run past ten or twelve posts lose readers. Cut what does not serve the point.");
  }
  add("cliche", f.cliche ? "warn" : "ok", f.cliche ? "Starts with a cliche" : "Fresh opening", "Excited to announce and thrilled to share look like everything else in the feed.");
  add("bait", f.bait ? "bad" : "ok", f.bait ? "Engagement bait" : "No engagement bait", "Comment YES or like if you agree brings empty reactions and can hurt trust.");
  add("question", f.endsWithQuestion || f.cta ? "ok" : "warn", f.endsWithQuestion || f.cta ? "Invites a reply" : "No question or invitation", "End with one easy question people can answer from their own experience.");
  add("specific", /\d/.test(whole) ? "ok" : "warn", /\d/.test(whole) ? "Has a number or detail" : "No number anywhere", "A number, a name or a real example makes a post believable.");
  const score = Math.max(0, 100 - checks.reduce((a, c) => a + PENALTY[c.level], 0));
  return { score, checks };
}
