import { formatById, structureById } from "./formats.ts";
import type { Issue } from "./simple.ts";

/** The base rules. With simple English on, the reading level is held to a Class 5 book. Dashes, quotes and made-up facts are always ruled out. */
export function writeSystem(simple = true): string {
  return `You write social media posts for one person.
${simple ? "- Use very simple English, like a Class 5 school book. Most sentences are under 12 words. Use everyday words. Avoid jargon. If a technical word is needed, explain it in a few simple words.\n- Write the way we speak. Warm, plain and honest. Use \"I\" for personal stories." : "- Write clear, natural English in our own tone. Keep it easy to read."}
- Never use em dashes or en dashes. Use a full stop or a comma instead.
- No emojis. No hashtags unless our own rules ask for them. Straight quotes only.
- Never invent facts, numbers, names, companies or results. Use only what we give you. If a detail is missing, keep the line general or use [brackets] for the missing detail.`;
}
export const WRITE_SYSTEM = writeSystem(true);

export type WriteInput = {
  topic: string; details?: string; format: string; structure?: string; platforms: ("linkedin" | "x")[];
  /** Our own story format, used instead of a built-in one. */
  custom?: { name: string; guide: string };
  /** The kind of writing: carousel, poll and so on. */
  output?: { name: string; guide: string } | null;
};

/** What we ask for. The format and the structure are explained in plain steps, and each platform gets its own size rules. */
export function writePrompt(i: WriteInput): string {
  const fmt = i.custom ? { name: i.custom.name, example: "", guide: i.custom.guide } : formatById(i.format);
  const st = structureById(i.structure);
  if (!fmt) throw new Error("Choose a story format.");
  const lines = [
    `Topic: ${i.topic.trim()}`,
    i.details?.trim() ? `Facts and details we want used (use only these facts):\n${i.details.trim()}` : "No extra facts were given, so keep it general and honest.",
    `Story format: ${fmt.name}.${fmt.example ? ` Style of the idea: "${fmt.example}".` : ""}\nHow to write it: ${fmt.guide}`,
  ];
  if (i.output && i.output.name !== "Standard post") lines.push(`Kind of writing: ${i.output.name}.\nHow: ${i.output.guide}`);
  if (st) lines.push(`Story structure to use inside the format: ${st.name} (${st.steps}).\nHow: ${st.guide}`);
  const want: string[] = [];
  if (i.platforms.includes("linkedin")) want.push('- LinkedIn: a LinkedIn post. A strong first line that makes the reader want more. Short lines, with a blank line between short paragraphs. About 600 to 1,200 characters. One idea. End with one easy question. For a micro story, use 5 to 8 very short lines.');
  if (i.platforms.includes("x")) want.push('- X: one X post, at most 270 characters including spaces. The single sharpest version of the story. No thread. No numbering.');
  lines.push(`Write these posts:\n${want.join("\n")}\n\n${formatRule(i.platforms)}`);
  return lines.join("\n\n");
}

/**
 * How the model must answer. Plain marker lines work with every model, also the ones that wrap JSON in talk or refuse JSON mode.
 */
export function formatRule(platforms: ("linkedin" | "x")[]): string {
  const parts = [platforms.includes("linkedin") ? "===LINKEDIN===\n(the LinkedIn post)" : "", platforms.includes("x") ? "===X===\n(the X post)" : ""].filter(Boolean).join("\n");
  return `Reply in exactly this format and write nothing else, no greeting and no notes:\n${parts}`;
}

/** Some models add a closing remark to the answer ("Let me know if you want changes!"). It is not part of the post. */
export function stripChatter(text: string): string {
  const paras = text.split(/\n{2,}/);
  while (paras.length > 1 && /^(let me know|hope (this|that|these)|i hope|feel free|would you like|want me to|do you want|happy to|note:|here(?:'s| is) (?:a|the|your))/i.test(paras[paras.length - 1].trim())) paras.pop();
  return paras.join("\n\n").trim();
}

/** Reads the answer. Marker lines in a few spellings are accepted, and a single post may come without any marker. */
export function parseSections(raw: string, platforms: ("linkedin" | "x")[]): Partial<Record<"linkedin" | "x", string>> {
  const marker = /^[#*_\s=-]*(linkedin|x)(?:\s+post)?[\s:*=_#-]*$/i;
  const out: Partial<Record<"linkedin" | "x", string[]>> = {};
  let current: "linkedin" | "x" | null = null;
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const m = marker.exec(line.trim());
    if (m && line.trim().length <= 24) { current = m[1].toLowerCase() as "linkedin" | "x"; out[current] ??= []; continue; }
    if (current) out[current]!.push(line);
  }
  const clean = (lines?: string[]) => {
    const t = stripChatter((lines ?? []).join("\n").replace(/^\s*```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/, "").trim());
    return t || undefined;
  };
  const result = { linkedin: clean(out.linkedin), x: clean(out.x) };
  if (!result.linkedin && !result.x && platforms.length === 1) {
    const whole = raw.replace(/^\s*```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
    if (whole) return { [platforms[0]]: whole };
  }
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v)) as Partial<Record<"linkedin" | "x", string>>;
}

/** The second try: the same posts with a list of what to fix. */
export function fixPrompt(current: Partial<Record<"linkedin" | "x", string>>, issues: Issue[]): string {
  const parts = (["linkedin", "x"] as const).filter((p) => current[p]).map((p) => `${p === "x" ? "X post" : "LinkedIn post"}:\n${current[p]}\nProblems: ${issues.filter((x) => x.platform === p).map((x) => x.problem).join(" ") || "none"}`);
  return `Fix these posts. Keep the same story and meaning. Do not add new facts. Change only what is needed to solve the problems.\n\n${parts.join("\n\n")}\n\n${formatRule((["linkedin", "x"] as const).filter((p) => current[p]))}`;
}
