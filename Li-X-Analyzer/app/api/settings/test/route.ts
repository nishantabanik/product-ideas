import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { getConnection } from "@/lib/connections";
import { llmText } from "@/lib/llm";
import { xConfigured, xMe } from "@/lib/comments/x";
import type { LinkedinConn } from "@/lib/comments/linkedin";

export const maxDuration = 60;

/** A small real call to each service, so the Settings page can say whether a connection actually works. */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { target, provider } = (await req.json()) as { target?: string; provider?: string };
  try {
    if (target === "llm") {
      const r = await llmText({ system: "Reply with the single word OK.", user: "ping", maxTokens: 20, provider: provider === "copilot" ? "copilot" : provider === "gateway" ? "gateway" : undefined });
      return NextResponse.json({ ok: true, detail: `${r.via} answered with ${r.model}` });
    }
    if (target === "x") {
      if (!xConfigured()) return NextResponse.json({ ok: false, detail: "The X keys are not set." });
      const me = await xMe();
      return NextResponse.json({ ok: true, detail: `Signed in as @${me.username}` });
    }
    if (target === "linkedin") {
      const c = await getConnection<LinkedinConn>("linkedin");
      if (!c) return NextResponse.json({ ok: false, detail: "LinkedIn is not connected." });
      const days = Math.floor((c.expiresAt - Date.now() / 1000) / 86_400);
      return NextResponse.json({ ok: days > 0, detail: days > 0 ? `Connected as ${c.name}, token valid for ${days} more days` : "The token has expired. Connect again." });
    }
    return NextResponse.json({ error: "Unknown target" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, detail: (e as Error).message });
  }
}
