import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { llmAvailable, llmText } from "@/lib/llm";
import { parseChoice } from "@/lib/llm/choice";
import { NO_MODEL } from "@/lib/studio/ai";
import { buildProfile } from "@/lib/studio/assets";
import { activeSelection } from "@/lib/studio/assets-store";
import { CHAT_SYSTEM, chatPrompt, cleanHistory } from "@/lib/studio/chat";
import { postFacts } from "@/lib/studio/store";
import { buildVoice, voiceSystemPrompt } from "@/lib/studio/voice";

export const maxDuration = 90;

/** One turn of the writing chat. Four of our best posts set the voice, the last eight messages give the context, the answer is capped. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as { platform?: string; messages?: unknown; draft?: string; model?: string };
  const platform = b.platform === "x" ? "x" : "linkedin";
  const history = cleanHistory(b.messages);
  let user: string;
  try { user = chatPrompt(history, b.draft); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
  if (!(await llmAvailable())) return NextResponse.json({ error: NO_MODEL }, { status: 400 });
  try {
    const posts = await postFacts(400).catch(() => []);
    // Whatever is switched on in My style (tone, rules, memory, skill files) also guides the chat, within a smaller budget.
    const profile = buildProfile(await activeSelection(platform).catch(() => ({ styles: [], memories: [], skills: [] })), 6000).text;
    const system = `${voiceSystemPrompt(platform, buildVoice(posts, platform, 4))}${profile}\n\n${CHAT_SYSTEM}\nWe are writing for ${platform === "x" ? "X (280 characters per post, links count 23)" : "LinkedIn"} right now.`;
    const pick = parseChoice(b.model);
    const r = await llmText({ system, user, maxTokens: 900, model: pick.model, provider: pick.provider });
    return NextResponse.json({ reply: r.text.trim(), model: r.model });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
