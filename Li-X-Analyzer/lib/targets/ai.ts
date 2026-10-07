import { z } from "zod";
import { llmAvailable, llmJson } from "../llm";
import { COMMENT_PROMPTS } from "./prompts.ts";

export const NO_MODEL = "No model is connected. Add a gateway or sign in with GitHub Copilot on the Settings page.";
const Out = z.object({ comments: z.array(z.object({ angle: z.string().describe("a few words naming the angle"), text: z.string() })).min(1).max(3) });

/** Three short, specific comments on someone's post. Without a model we hand back the fixed prompts instead. */
export async function suggestComments(o: { platform: "linkedin" | "x"; name: string; topics: string; post: string }) {
  if (!(await llmAvailable())) return { via: "prompts" as const, message: "A model would write ready comments here. Without one, use these prompts.", prompts: COMMENT_PROMPTS };
  const r = await llmJson(Out, {
    system: "You write comments for one person to leave on other people's posts. Each comment is short (one to three sentences), specific to the post, adds something useful (a number, an example, a precise question or a reasoned counterpoint), and sounds like a person. No flattery, no hashtags, no emoji, no em dashes, no exclamation marks. Never invent facts about the commenter; use brackets like [number] where a real detail is needed.",
    user: `Write three different comments on this ${o.platform === "x" ? "X" : "LinkedIn"} post by ${o.name}.${o.topics ? ` They write about: ${o.topics}.` : ""}${o.platform === "x" ? " Keep each under 280 characters." : ""}\n\nPost:\n${o.post.slice(0, 4000)}`,
    maxTokens: 900,
  });
  return { via: "model" as const, comments: r.data.comments };
}
