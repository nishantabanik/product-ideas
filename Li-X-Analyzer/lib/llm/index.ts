import { z } from "zod";
import { extractJson } from "./json.ts";
import { chatGateway, envGateway, resolveEndpoint, type ChatOpts, type ChatResult, type GatewayCfg } from "./gateway.ts";
import { chatCopilot, copilotModel, dbStore, type Store } from "./copilot.ts";

export type LlmKind = "gateway" | "copilot";
export type LlmStatus = { kind: LlmKind | null; label: string; model: string | null; detail: string };

/** The gateway saved on the Settings page (encrypted in our database) wins over the one in the environment. */
export async function activeGateway(): Promise<{ cfg: GatewayCfg; from: "settings" | "environment" } | null> {
  try {
    const { getConnection } = await import("../connections");
    const saved = await getConnection<GatewayCfg>("gateway");
    if (saved?.url && saved.key) return { cfg: saved, from: "settings" };
  } catch { /* no database yet */ }
  const env = envGateway();
  return env ? { cfg: env, from: "environment" } : null;
}

/** Which model backend is available. A gateway wins, unless LLM_PROVIDER says copilot. */
export async function llmStatus(store?: Store): Promise<LlmStatus> {
  const wantCopilot = process.env.LLM_PROVIDER === "copilot";
  const gw = wantCopilot ? null : await activeGateway();
  if (gw) {
    let host = "gateway";
    let style = "";
    try { const r = resolveEndpoint(gw.cfg.url, gw.cfg.style); host = new URL(r.url).host; style = r.style; } catch { /* shown as a config error when used */ }
    return { kind: "gateway", label: `Gateway (${host})`, model: gw.cfg.model ?? null, detail: `${style ? `${style} style, ` : "check the URL, "}set on the ${gw.from === "settings" ? "Settings page" : "environment"}` };
  }
  try {
    const c = await (store ?? (await dbStore())).get();
    if (c) return { kind: "copilot", label: `GitHub Copilot (${c.login})`, model: copilotModel(), detail: "experimental sign in" };
  } catch { /* no database yet */ }
  return { kind: null, label: "Not set up", model: null, detail: "Add a gateway URL, key and model on the Settings page, or sign in with GitHub Copilot on the Settings page." };
}

export const llmAvailable = async () => (await llmStatus()).kind !== null;

async function chat(o: ChatOpts, store?: Store): Promise<ChatResult & { via: LlmKind }> {
  // A model picked in the app names its source, so Copilot models work even when a gateway is the default.
  if (o.provider === "copilot") {
    const st = store ?? (await dbStore());
    if (!(await st.get())) throw new Error("GitHub Copilot is not signed in. Sign in on the Settings page.");
    return { ...(await chatCopilot(o, st)), via: "copilot" };
  }
  if (o.provider === "gateway") {
    const g = await activeGateway();
    if (!g) throw new Error("No gateway is set. Add the gateway URL and key on the Settings page.");
    return { ...(await chatGateway(o, g.cfg)), via: "gateway" };
  }
  const s = await llmStatus(store);
  if (s.kind === "gateway") return { ...(await chatGateway(o, (await activeGateway())!.cfg)), via: "gateway" };
  if (s.kind === "copilot") return { ...(await chatCopilot(o, store ?? (await dbStore()))), via: "copilot" };
  throw new Error(s.detail);
}

export const llmText = chat;

/**
 * Asks for JSON that fits `schema`. Gateways differ in what they support, so the schema goes into the prompt, the answer is
 * validated here, and a bad answer gets one repair attempt.
 */
export async function llmJson<T>(schema: z.ZodType<T>, o: Omit<ChatOpts, "json">, store?: Store): Promise<{ data: T; model: string; via: LlmKind; usage?: { input: number; output: number } }> {
  const hint = `\n\nReply with a single JSON object that matches this JSON schema, and nothing else. No prose, no code fences.\n${JSON.stringify(z.toJSONSchema(schema))}`;
  const first = await chat({ ...o, system: o.system + hint, json: true }, store);
  const parse = (text: string) => { try { return schema.safeParse(extractJson(text)); } catch (e) { return { success: false as const, error: e as Error }; } };
  let r = parse(first.text);
  if (r.success) return { data: r.data, model: first.model, via: first.via, usage: first.usage };

  const why = r.error instanceof Error ? r.error.message : JSON.stringify((r.error as z.ZodError).issues.slice(0, 5));
  const second = await chat({ ...o, system: o.system + hint, user: `${o.user}\n\nYour previous answer was not valid: ${why.slice(0, 600)}\nReturn only the corrected JSON object.`, json: true }, store);
  r = parse(second.text);
  if (!r.success) throw new Error("The model did not return JSON in the format we asked for, even after a retry");
  const usage = first.usage && second.usage ? { input: first.usage.input + second.usage.input, output: first.usage.output + second.usage.output } : second.usage;
  return { data: r.data, model: second.model, via: second.via, usage };
}
