import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { getConnection } from "@/lib/connections";
import { activeGateway } from "@/lib/llm";
import { listGatewayModels, type GatewayCfg } from "@/lib/llm/gateway";

export const maxDuration = 60;

/** Asks the gateway which models it offers. Fields left empty fall back to what is already saved (or set in the environment). */
export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as Partial<GatewayCfg>;
  const saved = (await getConnection<GatewayCfg>("gateway")) ?? (await activeGateway())?.cfg ?? null;
  const cfg: GatewayCfg = {
    url: (b.url ?? "").trim() || saved?.url || "",
    key: (b.key ?? "").trim() || saved?.key || "",
    style: (b.style ?? "").trim() || saved?.style,
    keyHeader: (b.keyHeader ?? "").trim() || saved?.keyHeader,
    extraHeaders: (b.extraHeaders ?? "").trim() || saved?.extraHeaders,
  };
  if (!cfg.url || !cfg.key) return NextResponse.json({ error: "Enter the gateway API URL and key first." }, { status: 400 });
  try {
    return NextResponse.json({ models: await listGatewayModels(cfg) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
