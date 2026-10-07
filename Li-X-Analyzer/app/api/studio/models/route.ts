import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { activeGateway, llmStatus } from "@/lib/llm";
import { formatChoice } from "@/lib/llm/choice";
import { copilotModel, dbStore, listCopilotModels } from "@/lib/llm/copilot";
import { listGatewayModels } from "@/lib/llm/gateway";

export const maxDuration = 45;

type SourceInfo = { kind: "gateway" | "copilot"; label: string; current: string | null; models: string[]; error?: string };

/** Every model we can write with, from every connected source: our gateway and GitHub Copilot. */
export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  const sources: SourceInfo[] = [];

  const gw = await activeGateway().catch(() => null);
  if (gw) {
    const info: SourceInfo = { kind: "gateway", label: "Our gateway", current: gw.cfg.model ?? null, models: [] };
    try { info.models = await listGatewayModels(gw.cfg); } catch (e) { info.error = (e as Error).message; }
    if (info.current && !info.models.includes(info.current)) info.models.unshift(info.current);
    sources.push(info);
  }

  const store = await dbStore().catch(() => null);
  const cop = store ? await store.get().catch(() => null) : null;
  if (store && cop) {
    const info: SourceInfo = { kind: "copilot", label: `GitHub Copilot (${cop.login})`, current: copilotModel(), models: [] };
    try {
      info.models = await listCopilotModels(store);
      if (!info.models.length) info.error = "GitHub did not list any models. Check that this account has an active Copilot plan, or sign in again on the Settings page.";
    } catch (e) { info.error = (e as Error).message; }
    if (info.current && !info.models.includes(info.current)) info.models.unshift(info.current);
    sources.push(info);
  }

  const status = await llmStatus().catch(() => null);
  const def = status?.kind && status.model ? formatChoice(status.kind, status.model) : sources[0]?.current ? formatChoice(sources[0].kind, sources[0].current) : null;
  return NextResponse.json({ sources: sources.map((s) => ({ ...s, models: s.models.map((m) => ({ value: formatChoice(s.kind, m), name: m })) })), default: def });
}
