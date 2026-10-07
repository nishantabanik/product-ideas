import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { llmAvailable } from "@/lib/llm";
import { NO_MODEL } from "@/lib/studio/ai";
import { buildProfile } from "@/lib/studio/assets";
import { assetsByIds } from "@/lib/studio/assets-store";
import { formatById, outputById, structureById } from "@/lib/studio/formats";
import { postFacts } from "@/lib/studio/store";
import { writePosts } from "@/lib/studio/write";

export const maxDuration = 120;

type Body = {
  topic?: string; details?: string; format?: string; structure?: string; platforms?: string[]; model?: string; useVoice?: boolean;
  tone?: string; styles?: string[]; memories?: string[]; skills?: string[]; output?: string; simple?: boolean;
};
const ids = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : []);

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as Body;
  const topic = (b.topic ?? "").trim().slice(0, 1500);
  if (!topic) return NextResponse.json({ error: "Type the topic first." }, { status: 400 });
  const platforms = (b.platforms ?? []).filter((p): p is "linkedin" | "x" => p === "linkedin" || p === "x");
  if (!platforms.length) return NextResponse.json({ error: "Choose LinkedIn, X or both." }, { status: 400 });

  // Our own items: tone, rules, memory, skill files, and an own story format or kind of writing.
  const customFormat = b.format?.startsWith("custom:") ? b.format.slice(7) : null;
  const customOutput = b.output?.startsWith("custom:") ? b.output.slice(7) : null;
  const wanted = [...ids(b.styles), ...ids(b.memories), ...ids(b.skills), ...(b.tone ? [b.tone] : []), ...(customFormat ? [customFormat] : []), ...(customOutput ? [customOutput] : [])];
  let assets: Awaited<ReturnType<typeof assetsByIds>> = [];
  try { assets = await assetsByIds(wanted); } catch (e) { return NextResponse.json({ error: `Could not load our style items: ${(e as Error).message}` }, { status: 500 }); }
  const fits = (a: (typeof assets)[number]) => a.platform === "both" || platforms.includes(a.platform);
  const pick = (kind: string, list: string[]) => assets.filter((a) => a.kind === kind && list.includes(a.id) && fits(a));

  let custom: { name: string; guide: string } | undefined;
  if (customFormat) {
    const f = assets.find((a) => a.id === customFormat && a.kind === "format");
    if (!f) return NextResponse.json({ error: "That story format of ours no longer exists." }, { status: 400 });
    custom = { name: f.name, guide: f.body };
  } else if (!formatById(b.format)) return NextResponse.json({ error: "Choose a story format." }, { status: 400 });

  let output: { name: string; guide: string } | null = null;
  if (customOutput) { const o = assets.find((a) => a.id === customOutput && a.kind === "output"); if (o) output = { name: o.name, guide: o.body }; }
  else { const o = outputById(b.output); if (o) output = { name: o.name, guide: o.guide }; }

  if (!(await llmAvailable())) return NextResponse.json({ error: NO_MODEL }, { status: 400 });
  const profile = buildProfile({ tone: b.tone ? pick("tone", [b.tone])[0] ?? null : null, styles: pick("style", ids(b.styles)), memories: pick("memory", ids(b.memories)), skills: pick("skill", ids(b.skills)) });
  try {
    const posts = b.useVoice ? await postFacts(400).catch(() => []) : [];
    const out = await writePosts({
      topic, details: (b.details ?? "").slice(0, 3000), format: custom ? "custom" : b.format!, custom, output, structure: structureById(b.structure) ? b.structure : undefined,
      platforms, model: (b.model ?? "").trim().slice(0, 120) || undefined, useVoice: Boolean(b.useVoice), posts, profile: profile.text, simple: b.simple !== false,
    });
    return NextResponse.json({ ...out, shortened: profile.shortened, profileTokens: Math.ceil(profile.chars / 4) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
