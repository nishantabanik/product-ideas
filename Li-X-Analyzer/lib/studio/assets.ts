/**
 * Our writing profile: the tone we want, our way of writing, what the writer should remember about us, our own story formats,
 * our own kinds of writing, and skill files. Each can be switched on for a post. This file holds the pure logic.
 */
export type AssetKind = "tone" | "style" | "memory" | "format" | "output" | "skill";
export type Asset = { id: string; kind: AssetKind; name: string; body: string; platform: "both" | "linkedin" | "x"; active: boolean; position: number };

export const KINDS: Record<AssetKind, { label: string; max: number }> = {
  tone: { label: "Tone", max: 1500 },
  style: { label: "Way of writing", max: 3000 },
  memory: { label: "Memory", max: 3000 },
  format: { label: "Story format", max: 2000 },
  output: { label: "Writing format", max: 1500 },
  skill: { label: "Skill file", max: 20000 },
};

export const estimateTokens = (chars: number) => Math.ceil(chars / 4);

export function validateAsset(i: { kind?: string; name?: string; body?: string; platform?: string; active?: boolean }): { kind: AssetKind; name: string; body: string; platform: Asset["platform"]; active: boolean } {
  const kind = i.kind as AssetKind;
  if (!(kind in KINDS)) throw new Error("Unknown kind.");
  const name = (i.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const body = (i.body ?? "").replace(/\r/g, "").trim();
  if (!name) throw new Error("Give it a name.");
  if (!body) throw new Error("Write what it says.");
  if (body.length > KINDS[kind].max) throw new Error(`${KINDS[kind].label} can have at most ${KINDS[kind].max.toLocaleString("en-US")} characters, this has ${body.length.toLocaleString("en-US")}.`);
  return { kind, name, body, platform: i.platform === "linkedin" || i.platform === "x" ? i.platform : "both", active: Boolean(i.active) };
}

/** Reads a skill file (a markdown file, with or without front matter). The name and the description come from the front matter, else the first heading, else the file name. */
export function parseSkillFile(text: string, filename = "skill"): { name: string; description: string; body: string } {
  const t = text.replace(/^﻿/, "").replace(/\r/g, "");
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(t);
  const meta: Record<string, string> = {};
  if (fm) for (const line of fm[1].split("\n")) { const m = /^([A-Za-z_-]+):\s*(.*)$/.exec(line.trim()); if (m) meta[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, "").trim(); }
  const body = (fm ? t.slice(fm[0].length) : t).trim();
  const heading = /^#\s+(.+)$/m.exec(body)?.[1]?.trim();
  const base = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  return { name: (meta.name || heading || base || "Skill").slice(0, 80), description: (meta.description || "").slice(0, 300), body };
}

export type Selection = { tone?: Asset | null; styles: Asset[]; memories: Asset[]; skills: Asset[] };
export const PROFILE_BUDGET = 14000; // characters sent with a post, about 3,500 tokens

const cut = (text: string, max: number) => {
  if (text.length <= max) return text;
  const part = text.slice(0, max);
  const at = Math.max(part.lastIndexOf("\n\n"), part.lastIndexOf(". "));
  return `${(at > max * 0.6 ? part.slice(0, at + 1) : part).trim()}\n[shortened]`;
};

/**
 * The instructions we add to the writer: tone, rules, memory and skill files. Small items come first and in full. Skill files share
 * what is left of the budget, so a few big files cannot push everything else out. Returns what was shortened, so we can tell.
 */
export function buildProfile(sel: Selection, budget = PROFILE_BUDGET): { text: string; chars: number; shortened: string[] } {
  const shortened: string[] = [];
  const parts: string[] = [];
  let left = budget;
  const take = (name: string, body: string, cap: number) => {
    const room = Math.max(0, Math.min(cap, left));
    const out = cut(body, room);
    if (out.length < body.length) shortened.push(name);
    left -= out.length;
    return out;
  };
  if (sel.tone) parts.push(`Our tone:\n${take(sel.tone.name, sel.tone.body, 1500)}`);
  if (sel.styles.length) parts.push(`Our way of writing. Follow these rules:\n${sel.styles.map((s) => `- ${s.name}: ${take(s.name, s.body, 3000).replace(/\n+/g, " ")}`).join("\n")}`);
  if (sel.memories.length) parts.push(`What to remember about us. Use it when it fits the topic, and never go beyond it:\n${sel.memories.map((m) => `- ${m.name}: ${take(m.name, m.body, 3000).replace(/\n+/g, " ")}`).join("\n")}`);
  if (sel.skills.length) {
    const each = Math.max(1500, Math.floor(Math.max(0, left) / sel.skills.length));
    parts.push(`Skill files. These are instructions we want followed when they apply:\n${sel.skills.map((k) => `### ${k.name}\n${take(k.name, k.body, each)}`).join("\n\n")}`);
  }
  if (!parts.length) return { text: "", chars: 0, shortened };
  const text = `\n\n${parts.join("\n\n")}\n\nThe rules above about dashes, length and simple words always come first, even if one of the files says something else.`;
  return { text, chars: text.length, shortened };
}
