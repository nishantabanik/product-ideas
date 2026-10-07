/** The chat with the writing assistant. Only the last few messages are sent each time, which keeps every question cheap. */
export type ChatMessage = { role: "user" | "assistant"; content: string };

export const MAX_TURNS = 8; // messages sent along with a new question
export const MAX_CHARS = 4000; // per message

/** Cleans what the browser sent: valid roles, trimmed, capped, and the conversation must end with a question from us. */
export function cleanHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const list = raw
    .filter((m): m is ChatMessage => !!m && typeof m === "object" && ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") && typeof (m as ChatMessage).content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content);
  return list.slice(-MAX_TURNS);
}

/** One prompt holding the recent conversation and, when there is one, the draft we are working on. */
export function chatPrompt(history: ChatMessage[], draft?: string): string {
  const last = history[history.length - 1];
  if (!last || last.role !== "user") throw new Error("Ask a question first.");
  const earlier = history.slice(0, -1);
  const parts: string[] = [];
  if (draft?.trim()) parts.push(`The draft we are working on:\n"""\n${draft.trim().slice(0, 3000)}\n"""`);
  if (earlier.length) parts.push(`The conversation so far:\n${earlier.map((m) => `${m.role === "user" ? "Us" : "You"}: ${m.content}`).join("\n\n")}`);
  parts.push(`Our new message:\n${last.content}`);
  return parts.join("\n\n");
}

export const CHAT_SYSTEM = `You are our writing partner for LinkedIn and X. You help us draft posts, sharpen openings, check ideas and answer questions about how to write for these platforms.
- Answer briefly and plainly, in a few short paragraphs at most, unless we ask for more.
- When we ask for a post, write it in our own voice, ready to paste, with nothing before or after it except one short line if something needs saying.
- Never invent facts, numbers, names or results. Use [brackets] where a real detail is missing.
- If we ask about our own numbers, say you cannot see them here and suggest where in the app to look.`;
