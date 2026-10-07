export type Style = "openai" | "anthropic";
export type ChatOpts = { system: string; user: string; json?: boolean; maxTokens?: number; signal?: AbortSignal; /** Use this model instead of the one saved in Settings. */ model?: string; /** Use this source even when the other one is the default. */ provider?: "gateway" | "copilot" };
export type ChatResult = { text: string; model: string; usage?: { input: number; output: number } };

export type GatewayCfg = { url: string; key: string; model?: string; style?: string; keyHeader?: string; extraHeaders?: string };

/** The gateway from the environment. A gateway saved on the Settings page takes its place (see lib/llm/index.ts). */
export function envGateway(): GatewayCfg | null {
  const e = process.env;
  if (!e.GATEWAY_API_URL || !e.GATEWAY_API_KEY) return null;
  return { url: e.GATEWAY_API_URL, key: e.GATEWAY_API_KEY, model: e.GATEWAY_MODEL, style: e.GATEWAY_API_STYLE, keyHeader: e.GATEWAY_API_KEY_HEADER, extraHeaders: e.GATEWAY_EXTRA_HEADERS };
}
export const gatewayConfigured = () => envGateway() !== null;

/**
 * Turns whatever URL we were given into the chat endpoint. Full endpoints are used as they are. A bare host or a /v1 base gets the
 * usual path added. The style (OpenAI or Anthropic) follows the path unless GATEWAY_API_STYLE says otherwise.
 */
export function resolveEndpoint(raw: string, style?: string): { url: string; style: Style } {
  const u = new URL(raw.trim());
  let path = u.pathname.replace(/\/+$/, "");
  const st: Style = style === "anthropic" || style === "openai" ? style : /\/messages$/.test(path) ? "anthropic" : "openai";
  const tail = st === "openai" ? "/chat/completions" : "/messages";
  if (!path.endsWith(tail)) path += /\/v\d+$/.test(path) || /\/v\d+\//.test(`${path}/`) ? tail : `/v1${tail}`;
  u.pathname = path;
  return { url: u.toString(), style: st };
}

export function headers(style: Style, cfg: GatewayCfg): Record<string, string> {
  const key = cfg.key;
  const h: Record<string, string> = { "content-type": "application/json" };
  const custom = cfg.keyHeader?.trim();
  if (custom) h[custom] = key;
  else {
    h.authorization = `Bearer ${key}`;
    if (style === "anthropic") { h["x-api-key"] = key; h["anthropic-version"] = "2023-06-01"; }
  }
  if (cfg.extraHeaders?.trim()) {
    try { Object.assign(h, JSON.parse(cfg.extraHeaders)); } catch { throw new Error("Extra headers must be a JSON object"); }
  }
  return h;
}

export function explain(status: number, body: string): string {
  const snippet = body.replace(/\s+/g, " ").slice(0, 200);
  if (status === 401 || status === 403) return `The gateway rejected our key (HTTP ${status}). Check GATEWAY_API_KEY. ${snippet}`;
  if (status === 404) return `The gateway endpoint was not found (HTTP 404). Check GATEWAY_API_URL and GATEWAY_MODEL. ${snippet}`;
  if (status === 429) return "The gateway is rate limiting us (HTTP 429). It will work again after a short wait.";
  return `The gateway answered HTTP ${status}. ${snippet}`;
}

const UNSUPPORTED = /unsupported model|model[^"\\]{0,60}(?:not (?:found|supported|available)|does not exist|is not a valid)|unknown model|invalid model|no such model/i;

/** The gateway accepted our request but its own provider refused the model it maps this name to. */
export function unsupportedModel(model: string, body: string): string {
  const inner = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let said = "";
  for (let m = inner.exec(body); m; m = inner.exec(body)) said = m[1];
  const text = (said || body).replace(/\\n/g, " ").replace(/\\"/g, '"').replace(/\s+/g, " ").trim().slice(0, 160);
  return `The gateway cannot use the model "${model}". It said: ${text}. This is set inside the gateway, not in this app: the name "${model}" points at a model that its provider rejects. In the gateway, open this model (or combo) and choose a model the provider supports, or pick another model here.`;
}

const textOf = (c: unknown): string =>
  typeof c === "string" ? c : Array.isArray(c) ? c.map((p: { text?: string }) => p?.text ?? "").join("") : "";

type Variant = { label: string; stream: boolean | undefined; json: boolean; tokens: "max_tokens" | "max_completion_tokens" | "none" };

/**
 * Gateways and models differ in what a request may contain: some refuse JSON mode, some refuse max_tokens, some only answer as a
 * stream. We start with the usual request and, when a model refuses it, try the other shapes until one is accepted.
 */
function variantsFor(style: Style, wantJson: boolean): Variant[] {
  if (style === "anthropic") return [{ label: "standard", stream: false, json: false, tokens: "max_tokens" }, { label: "streamed", stream: true, json: false, tokens: "max_tokens" }];
  return [
    { label: "standard", stream: false, json: wantJson, tokens: "max_tokens" },
    ...(wantJson ? [{ label: "without JSON mode", stream: false, json: false, tokens: "max_tokens" } as Variant] : []),
    { label: "streamed", stream: true, json: false, tokens: "max_tokens" },
    { label: "max_completion_tokens", stream: undefined, json: false, tokens: "max_completion_tokens" },
    { label: "minimal", stream: undefined, json: false, tokens: "none" },
  ];
}

/** What worked last time for a model on a gateway, so a model that needs the streamed shape does not fail first every time. */
const worked = new Map<string, string>();

export async function chatGateway(o: ChatOpts, cfg: GatewayCfg | null = envGateway()): Promise<ChatResult> {
  if (!cfg) throw new Error("No gateway is set. Add the gateway API URL and key on the Settings page.");
  const model = (o.model || cfg.model)?.trim();
  if (!model) throw new Error("GATEWAY_MODEL is not set. Add the model name our gateway expects.");
  const { url, style } = resolveEndpoint(cfg.url, cfg.style);
  const maxTokens = o.maxTokens ?? 4000;
  const key = `${url}|${model}|${style}|${o.json ? "json" : "text"}`;

  const send = (v: Variant) => {
    const limit = v.tokens === "none" ? {} : { [v.tokens]: maxTokens };
    const stream = v.stream === undefined ? {} : { stream: v.stream };
    const body = style === "anthropic"
      ? { model, ...limit, ...stream, system: o.system, messages: [{ role: "user", content: o.user }] }
      : { model, ...limit, ...stream, messages: [{ role: "system", content: o.system }, { role: "user", content: o.user }], ...(v.json ? { response_format: { type: "json_object" } } : {}) };
    return fetch(url, { method: "POST", headers: headers(style, cfg), body: JSON.stringify(body), signal: o.signal ?? AbortSignal.timeout(120_000) }).catch((e: Error) => { throw new Error(`The gateway could not be reached (${e.message}).${isLocalAddress(url) ? LOCAL_HINT : ""}`); });
  };

  const list = variantsFor(style, Boolean(o.json));
  const first = worked.get(key);
  const ordered = first ? [...list.filter((v) => v.label === first), ...list.filter((v) => v.label !== first)] : list;
  const attempts: { label: string; message: string }[] = [];

  for (const v of ordered) {
    const res = await send(v);
    const raw = await res.text();
    if (!res.ok) {
      // The gateway names a model its provider does not know. Another request shape cannot fix that, the gateway's own setup can.
      if ([400, 404, 422].includes(res.status) && UNSUPPORTED.test(raw)) throw new Error(unsupportedModel(model, raw));
      // A wrong key, an unknown endpoint or a rate limit will not change with another request shape.
      if ([401, 403, 404, 429].includes(res.status)) throw new Error(explain(res.status, raw));
      attempts.push({ label: v.label, message: explain(res.status, raw) });
      continue;
    }
    const parsed = parseChatBody(raw, style);
    if (!parsed) {
      const type = res.headers.get("content-type") ?? "unknown type";
      const snippet = raw.replace(/\s+/g, " ").slice(0, 200) || "(empty answer)";
      attempts.push({ label: v.label, message: `The gateway answered, but not with a chat reply we can read (HTTP ${res.status}, ${type}) from ${url}. It said: ${snippet}` });
      continue;
    }
    if (!parsed.text.trim()) { attempts.push({ label: v.label, message: "The gateway returned an empty answer." }); continue; }
    worked.set(key, v.label);
    const u = parsed.usage;
    return { text: parsed.text, model: parsed.model ?? model, usage: u };
  }
  const last = attempts[attempts.length - 1];
  throw new Error(attempts.length > 1
    ? `${attempts[0].message} We then tried ${attempts.length - 1} other request format${attempts.length > 2 ? "s" : ""} (${attempts.slice(1).map((a) => a.label).join(", ")}). The last one said: ${last.message}`
    : attempts[0].message);
}

type Parsed = { text: string; model?: string; usage?: { input: number; output: number } };
const usageOf = (u?: Record<string, number>) => (u ? { input: u.prompt_tokens ?? u.input_tokens ?? 0, output: u.completion_tokens ?? u.output_tokens ?? 0 } : undefined);

/**
 * Reads a chat answer. Most gateways return one JSON object, but some stream the answer as server sent events even when we ask
 * for a single reply, so both are understood. Returns null when the body is neither.
 */
export function parseChatBody(raw: string, style: Style): Parsed | null {
  try {
    const d = JSON.parse(raw) as { choices?: { message?: { content?: unknown }; text?: string }[]; content?: unknown; output_text?: string; message?: { content?: unknown }; model?: string; usage?: Record<string, number> };
    const text = style === "anthropic" ? textOf(d.content) : textOf(d.choices?.[0]?.message?.content) || (d.choices?.[0]?.text ?? "") || textOf(d.content) || (d.output_text ?? "") || textOf(d.message?.content);
    return { text, model: d.model, usage: usageOf(d.usage) };
  } catch { /* maybe a stream */ }
  if (!/(^|\n)\s*data:/.test(raw)) return null;
  let text = "";
  let model: string | undefined;
  let usage: Record<string, number> | undefined;
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*data:\s*(.*)$/.exec(line);
    if (!m || m[1] === "[DONE]" || !m[1]) continue;
    try {
      const e = JSON.parse(m[1]) as { model?: string; usage?: Record<string, number>; choices?: { delta?: { content?: unknown }; message?: { content?: unknown } }[]; delta?: { text?: string }; message?: { model?: string; usage?: Record<string, number> }; type?: string };
      model ??= e.model ?? e.message?.model;
      usage = e.usage ?? e.message?.usage ?? usage;
      text += textOf(e.choices?.[0]?.delta?.content) + (e.choices?.[0]?.message ? textOf(e.choices[0].message.content) : "") + (e.delta?.text ?? "");
    } catch { /* a partial or non JSON event */ }
  }
  return { text, model, usage: usageOf(usage) };
}

/** True for addresses that only exist on the machine or network the person sits on, never reachable from Vercel. */
export function isLocalAddress(raw: string): boolean {
  try {
    const h = new URL(raw).hostname;
    return h === "localhost" || h === "::1" || h === "[::1]" || h.endsWith(".local") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(h);
  } catch { return false; }
}
const LOCAL_HINT = " This address is on our own computer (localhost or a private network), and the app runs on Vercel's servers, which cannot reach it. Run the app on our computer too, or give the gateway a public https address, for example with a Cloudflare tunnel or ngrok.";

/** Where a gateway lists its models, most likely first. A /v1 base and a bare host are both tried. */
export function modelsUrls(raw: string, style?: string): string[] {
  const { url } = resolveEndpoint(raw, style);
  const u = new URL(url);
  const base = u.pathname.replace(/\/(chat\/completions|messages)$/, "").replace(/\/+$/, "");
  const out = [`${u.origin}${base}/models`];
  if (!/\/v\d+$/.test(base)) out.push(`${u.origin}${base}/v1/models`);
  if (base) out.push(`${u.origin}/v1/models`, `${u.origin}/models`);
  return [...new Set(out)];
}

/** Model ids from the shapes gateways use: OpenAI {data:[{id}]}, {models:[...]}, or a plain list. */
export function parseModelList(body: unknown): string[] {
  const b = body as { data?: unknown; models?: unknown; result?: unknown };
  const list = Array.isArray(body) ? body : Array.isArray(b?.data) ? b.data : Array.isArray(b?.models) ? b.models : Array.isArray(b?.result) ? b.result : [];
  const ids = list.map((m: unknown) => (typeof m === "string" ? m : ((m as { id?: string; name?: string; model?: string })?.id ?? (m as { name?: string })?.name ?? (m as { model?: string })?.model ?? ""))).filter((x: string) => typeof x === "string" && x.trim()).map((x: string) => x.trim());
  return [...new Set(ids)].sort((a, c) => a.localeCompare(c));
}

export async function listGatewayModels(cfg: GatewayCfg): Promise<string[]> {
  const { style } = resolveEndpoint(cfg.url, cfg.style);
  const h = headers(style, cfg);
  delete h["content-type"];
  const tried: string[] = [];
  for (const url of modelsUrls(cfg.url, cfg.style)) {
    try {
      const res = await fetch(url, { headers: h, signal: AbortSignal.timeout(20_000) });
      const raw = await res.text();
      if (res.ok) {
        let ids: string[] = [];
        try { ids = parseModelList(JSON.parse(raw)); } catch { /* not JSON, try the next address */ }
        if (ids.length) return ids;
        tried.push(`${url} answered but listed no models`);
      } else if (res.status === 401 || res.status === 403) {
        throw new Error(`The gateway rejected our key (HTTP ${res.status}) at ${url}. Check the API key and the key header name.`);
      } else tried.push(`${url} gave HTTP ${res.status}`);
    } catch (e) {
      if (/rejected our key/.test((e as Error).message)) throw e;
      tried.push(`${url} was not reachable (${(e as Error).message})`);
    }
  }
  throw new Error(`We could not get a model list. ${tried.join("; ")}.${isLocalAddress(cfg.url) ? LOCAL_HINT : ""} Or type the model name by hand.`);
}
