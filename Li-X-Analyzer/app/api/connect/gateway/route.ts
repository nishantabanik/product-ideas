import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { deleteConnection, getConnection, saveConnection } from "@/lib/connections";
import { resolveEndpoint, type GatewayCfg } from "@/lib/llm/gateway";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json()) as Partial<GatewayCfg>;
  const old = await getConnection<GatewayCfg>("gateway");
  const cfg: GatewayCfg = {
    url: (b.url ?? "").trim(),
    key: (b.key ?? "").trim() || old?.key || "", // an empty key field keeps the saved key
    model: (b.model ?? "").trim(),
    style: (b.style ?? "").trim() || undefined,
    keyHeader: (b.keyHeader ?? "").trim() || undefined,
    extraHeaders: (b.extraHeaders ?? "").trim() || undefined,
  };
  if (!cfg.url || !cfg.key || !cfg.model) return NextResponse.json({ error: "The URL, the key and the model name are all needed." }, { status: 400 });
  try { resolveEndpoint(cfg.url, cfg.style); } catch { return NextResponse.json({ error: "The URL does not look right. Use something like https://host/v1" }, { status: 400 }); }
  if (cfg.extraHeaders) { try { JSON.parse(cfg.extraHeaders); } catch { return NextResponse.json({ error: "Extra headers must be a JSON object." }, { status: 400 }); } }
  await saveConnection("gateway", cfg);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const denied = await requireAuth();
  if (denied) return denied;
  await deleteConnection("gateway");
  return NextResponse.json({ ok: true });
}
