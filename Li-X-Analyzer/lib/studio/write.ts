import { llmText } from "../llm";
import { parseChoice } from "../llm/choice.ts";
import { buildVoice, voiceSystemPrompt } from "./voice.ts";
import { checkPost, fitX, plainText, readingGrade, X_MAX, type Issue } from "./simple.ts";
import { fixPrompt, formatRule, parseSections, writePrompt, writeSystem, type WriteInput } from "./write-prompt.ts";
import type { PostFact } from "./types.ts";
import { tweetLength } from "./thread.ts";

export type Written = {
  linkedin?: string;
  x?: string;
  grade: { linkedin: number | null; x: number | null };
  xChars: number | null;
  model: string;
  fixed: boolean;
};

/** Writes the posts. One call, and one more only when a post is too long, too hard to read or uses a dash. */
export async function writePosts(i: WriteInput & { model?: string; useVoice?: boolean; posts?: PostFact[]; profile?: string; simple?: boolean }): Promise<Written> {
  const simple = i.simple !== false;
  const pick = parseChoice(i.model);
  if (!i.topic.trim()) throw new Error("Type the topic first.");
  if (!i.platforms.length) throw new Error("Choose LinkedIn, X or both.");
  const voice = i.useVoice && i.posts ? `\n\nFor the voice, here are a few of our own posts. Match their tone but keep the English very simple.\n${buildVoice(i.posts, i.platforms[0], 3).samples.map((t, n) => `Example ${n + 1}:\n${t.slice(0, 600)}`).join("\n\n")}` : "";
  const system = writeSystem(simple) + voice + (i.profile ?? "");
  const ask = async (user: string) => {
    const r = await llmText({ system, user, maxTokens: 1500, model: pick.model, provider: pick.provider });
    return { text: r.text, model: r.model };
  };
  const clean = (o: Partial<Record<"linkedin" | "x", string>>) => ({ linkedin: i.platforms.includes("linkedin") && o.linkedin ? plainText(o.linkedin) : undefined, x: i.platforms.includes("x") && o.x ? plainText(o.x) : undefined });

  // Plain marker lines instead of JSON: every model can follow them. A first answer that cannot be read gets one reminder.
  let reply = await ask(writePrompt(i));
  let model = reply.model;
  let posts = clean(parseSections(reply.text, i.platforms));
  if (!posts.linkedin && !posts.x) {
    reply = await ask(`${writePrompt(i)}\n\nYour last answer did not follow the format. ${formatRule(i.platforms)}`);
    model = reply.model;
    posts = clean(parseSections(reply.text, i.platforms));
  }
  if (!posts.linkedin && !posts.x) throw new Error(`The model answered, but not in the format we need. It said: ${reply.text.replace(/\s+/g, " ").trim().slice(0, 220) || "(nothing)"}. Try again, or pick another model.`);

  const issues: Issue[] = [...(posts.linkedin ? checkPost("linkedin", posts.linkedin, simple) : []), ...(posts.x ? checkPost("x", posts.x, simple) : [])];
  let fixed = false;
  if (issues.length) {
    try {
      const second = await ask(fixPrompt(posts, issues));
      model = second.model;
      const again = clean(parseSections(second.text, (["linkedin", "x"] as const).filter((p) => posts[p])));
      // Keep the new version only when it is no worse than the first one.
      const better = (a?: string, b?: string, p: "linkedin" | "x" = "linkedin") => (a && b ? (checkPost(p, b, simple).length <= checkPost(p, a, simple).length ? b : a) : a ?? b);
      posts = { linkedin: better(posts.linkedin, again.linkedin, "linkedin"), x: better(posts.x, again.x, "x") };
      fixed = true;
    } catch { /* keep the first version, the checks below still apply */ }
  }
  if (posts.x) posts.x = fitX(posts.x, X_MAX);
  return {
    ...posts,
    grade: { linkedin: posts.linkedin ? readingGrade(posts.linkedin) : null, x: posts.x ? readingGrade(posts.x) : null },
    xChars: posts.x ? tweetLength(posts.x) : null,
    model, fixed,
  };
}

export { voiceSystemPrompt };
