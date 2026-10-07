import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { draftVariants, generateIdeas, improveDraft, refreshOld, repurpose } from "@/lib/studio/ai";
import { lintDraft } from "@/lib/studio/lint";
import { listPillars, postFacts } from "@/lib/studio/store";
import type { Platform } from "@/lib/studio/types";

export const maxDuration = 120;
type Body = { task?: string; platform?: Platform; brief?: string; pillar?: string; hook?: string; asThread?: boolean; text?: string; thread?: string[]; from?: Platform; count?: number };

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as Body;
  const platform: Platform = b.platform === "x" ? "x" : "linkedin";
  try {
    const posts = await postFacts();
    switch (b.task) {
      case "draft":
        if (!b.brief?.trim()) return NextResponse.json({ error: "Say what the post is about first." }, { status: 400 });
        return NextResponse.json({ variants: await draftVariants({ platform, brief: b.brief.trim(), pillar: b.pillar, hook: b.hook, asThread: b.asThread, posts }) });
      case "repurpose":
        if (!b.text?.trim()) return NextResponse.json({ error: "There is no text to adapt." }, { status: 400 });
        return NextResponse.json(await repurpose({ text: b.text, from: b.from ?? platform, posts }));
      case "ideas":
        return NextResponse.json({ ideas: await generateIdeas({ platform, pillars: await listPillars(), posts, count: Math.min(10, Math.max(3, b.count ?? 6)) }) });
      case "improve": {
        const l = lintDraft(platform, b.text ?? "", b.thread ?? []);
        return NextResponse.json(await improveDraft({ platform, text: b.text ?? "", thread: b.thread, issues: l.checks.filter((c) => c.level !== "ok").map((c) => `${c.label}: ${c.tip}`), posts }));
      }
      case "refresh":
        return NextResponse.json({ text: await refreshOld({ platform, text: b.text ?? "", posts }) });
      default:
        return NextResponse.json({ error: "Unknown task" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
