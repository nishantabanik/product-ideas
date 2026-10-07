import type { ChatOpts, ChatResult } from "./gateway.ts";
import { explain } from "./gateway.ts";

/**
 * GitHub Copilot sign in, by the device code flow. This is NOT an official, documented API: the token exchange was worked out from
 * the VS Code Copilot extension, as other third party tools do. GitHub can change or block it at any time, so treat it as
 * experimental. A gateway is the stable choice.
 */
const gh = () => (process.env.GITHUB_BASE_URL || "https://github.com").replace(/\/$/, "");
const ghApi = () => (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
const clientId = () => process.env.GITHUB_COPILOT_CLIENT_ID || "Iv1.b507a08c87ecfe98";
const EDITOR = { "editor-version": "vscode/1.99.3", "editor-plugin-version": "copilot-chat/0.26.7", "user-agent": "GitHubCopilotChat/0.26.7", "copilot-integration-id": "vscode-chat" };

export type CopilotConnection = { githubToken: string; login: string; copilotToken?: string; expiresAt?: number; apiBase?: string };
export type Store = { get(): Promise<CopilotConnection | null>; set(c: CopilotConnection): Promise<void>; clear(): Promise<void> };

export async function dbStore(): Promise<Store> {
  const c = await import("../connections");
  return {
    get: async () => { const v = await c.getConnection<CopilotConnection>("copilot"); return v ? { githubToken: v.githubToken, login: v.login, copilotToken: v.copilotToken, expiresAt: v.expiresAt, apiBase: v.apiBase } : null; },
    set: (v) => c.saveConnection("copilot", v),
    clear: () => c.deleteConnection("copilot"),
  };
}

const json = (r: Response) => r.json().catch(() => ({})) as Promise<Record<string, unknown>>;
const post = (url: string, body: Record<string, string>) =>
  fetch(url, { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });

export type DeviceStart = { deviceCode: string; userCode: string; verificationUri: string; expiresIn: number; interval: number };

export async function startDeviceFlow(): Promise<DeviceStart> {
  const res = await post(`${gh()}/login/device/code`, { client_id: clientId(), scope: "read:user" });
  const d = await json(res);
  if (!res.ok || !d.device_code) throw new Error(`GitHub did not start the sign in (HTTP ${res.status}).`);
  return { deviceCode: String(d.device_code), userCode: String(d.user_code), verificationUri: String(d.verification_uri), expiresIn: Number(d.expires_in ?? 900), interval: Number(d.interval ?? 5) };
}

export type PollResult = { status: "pending" | "slow_down" | "done" | "error"; login?: string; message?: string; interval?: number };

export async function pollDeviceFlow(deviceCode: string, store: Store): Promise<PollResult> {
  const res = await post(`${gh()}/login/oauth/access_token`, { client_id: clientId(), device_code: deviceCode, grant_type: "urn:ietf:params:oauth:grant-type:device_code" });
  const d = await json(res);
  if (d.access_token) {
    const token = String(d.access_token);
    const me = await fetch(`${ghApi()}/user`, { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "li-x-analyzer" }, signal: AbortSignal.timeout(30_000) });
    const login = String(((await json(me)).login as string) ?? "unknown");
    await store.set({ githubToken: token, login });
    return { status: "done", login };
  }
  const err = String(d.error ?? "");
  if (err === "authorization_pending") return { status: "pending" };
  if (err === "slow_down") return { status: "slow_down", interval: Number(d.interval ?? 10) };
  if (err === "expired_token") return { status: "error", message: "The code expired. Start the sign in again." };
  if (err === "access_denied") return { status: "error", message: "The sign in was cancelled on GitHub." };
  return { status: "error", message: String(d.error_description ?? err ?? `GitHub answered HTTP ${res.status}`) };
}

/** A short lived Copilot token. It is renewed a minute before it runs out. */
export async function copilotSession(store: Store): Promise<{ token: string; api: string }> {
  const c = await store.get();
  if (!c) throw new Error("GitHub Copilot is not signed in. Sign in on the Settings page.");
  if (c.copilotToken && c.apiBase && (c.expiresAt ?? 0) - 60 > Date.now() / 1000) return { token: c.copilotToken, api: c.apiBase };
  const res = await fetch(`${ghApi()}/copilot_internal/v2/token`, { headers: { authorization: `token ${c.githubToken}`, accept: "application/json", ...EDITOR }, signal: AbortSignal.timeout(30_000) });
  const d = await json(res);
  if (!res.ok || !d.token) {
    throw new Error(res.status === 401 || res.status === 403 || res.status === 404
      ? "GitHub did not give us Copilot access. Check that this account has an active Copilot plan, or sign in again. GitHub may also have changed this unofficial sign in."
      : `GitHub answered HTTP ${res.status} when asking for Copilot access.`);
  }
  const api = String((d.endpoints as { api?: string } | undefined)?.api ?? "https://api.githubcopilot.com").replace(/\/$/, "");
  const next = { ...c, copilotToken: String(d.token), expiresAt: Number(d.expires_at ?? 0), apiBase: api };
  await store.set(next);
  return { token: next.copilotToken, api };
}

export const copilotModel = () => process.env.COPILOT_MODEL || "gpt-4.1";

export async function chatCopilot(o: ChatOpts, store: Store): Promise<ChatResult> {
  const { token, api } = await copilotSession(store);
  const model = o.model || copilotModel();
  const send = (withJson: boolean) => fetch(`${api}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "openai-intent": "conversation-panel", "x-request-id": crypto.randomUUID(), ...EDITOR },
    body: JSON.stringify({ model, stream: false, max_tokens: o.maxTokens ?? 4000, messages: [{ role: "system", content: o.system }, { role: "user", content: o.user }], ...(withJson ? { response_format: { type: "json_object" } } : {}) }),
    signal: o.signal ?? AbortSignal.timeout(120_000),
  });
  let res = await send(Boolean(o.json));
  if (o.json && (res.status === 400 || res.status === 422)) {
    const first = await res.text();
    if (/response_format|json/i.test(first)) res = await send(false);
    else throw new Error(explain(res.status, first));
  }
  const raw = await res.text();
  if (!res.ok) throw new Error(explain(res.status, raw).replace("The gateway", "GitHub Copilot"));
  const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[]; model?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("GitHub Copilot returned an empty answer");
  return { text, model: data.model ?? model, usage: data.usage ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0 } : undefined };
}

export async function listCopilotModels(store: Store): Promise<string[]> {
  const { token, api } = await copilotSession(store);
  const res = await fetch(`${api}/models`, { headers: { authorization: `Bearer ${token}`, ...EDITOR }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) return [];
  const d = (await res.json()) as { data?: { id: string; capabilities?: { type?: string } }[] };
  return (d.data ?? []).filter((m) => !m.capabilities?.type || m.capabilities.type === "chat").map((m) => m.id);
}
