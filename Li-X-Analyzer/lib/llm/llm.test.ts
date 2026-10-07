import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { extractJson } from "./json.ts";
import { resolveEndpoint, chatGateway, listGatewayModels, modelsUrls, parseModelList, isLocalAddress, parseChatBody } from "./gateway.ts";
import { llmJson, llmStatus } from "./index.ts";
import { pollDeviceFlow, startDeviceFlow, copilotSession, type CopilotConnection, type Store } from "./copilot.ts";

type Handler = (req: IncomingMessage, body: string, res: ServerResponse) => void;
async function serve(handler: Handler) {
  const seen: { url: string; headers: IncomingMessage["headers"]; body: string }[] = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { seen.push({ url: req.url ?? "", headers: req.headers, body }); handler(req, body, res); });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  return { url: `http://127.0.0.1:${port}`, seen, close: () => server.close() };
}
const reply = (res: ServerResponse, code: number, o: unknown) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
const openai = (content: string) => ({ model: "m-1", choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } });
const env = (o: Record<string, string | undefined>) => { for (const [k, v] of Object.entries(o)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };

test("json is pulled out of fences and surrounding prose", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Sure! Here it is: {"a":{"b":"}"},"c":[1,2]} Hope that helps'), { a: { b: "}" }, c: [1, 2] });
  assert.throws(() => extractJson("no json here"));
  assert.throws(() => extractJson('{"a": 1'));
});

test("endpoints are built from whatever URL we are given", () => {
  const e = (u: string, s?: string) => resolveEndpoint(u, s);
  assert.deepEqual(e("https://gw.example.com/v1/chat/completions"), { url: "https://gw.example.com/v1/chat/completions", style: "openai" });
  assert.equal(e("https://gw.example.com").url, "https://gw.example.com/v1/chat/completions");
  assert.equal(e("https://gw.example.com/").url, "https://gw.example.com/v1/chat/completions");
  assert.equal(e("https://gw.example.com/v1").url, "https://gw.example.com/v1/chat/completions");
  assert.equal(e("https://gw.example.com/openai/v1").url, "https://gw.example.com/openai/v1/chat/completions");
  assert.equal(e("https://gw.example.com/proxy").url, "https://gw.example.com/proxy/v1/chat/completions");
  assert.deepEqual(e("https://gw.example.com/anthropic/v1/messages"), { url: "https://gw.example.com/anthropic/v1/messages", style: "anthropic" });
  assert.equal(e("https://gw.example.com/v1", "anthropic").url, "https://gw.example.com/v1/messages");
  assert.equal(e("https://x.example.com/api?api-version=2024-06-01").url, "https://x.example.com/api/v1/chat/completions?api-version=2024-06-01");
});

test("an OpenAI style gateway gets our key as a bearer token and JSON mode", async () => {
  const gw = await serve((_r, _b, res) => reply(res, 200, openai('{"ok":true}')));
  env({ GATEWAY_API_URL: gw.url, GATEWAY_API_KEY: "k-123", GATEWAY_MODEL: "my-model", GATEWAY_API_STYLE: undefined, GATEWAY_API_KEY_HEADER: undefined });
  const r = await chatGateway({ system: "s", user: "u", json: true });
  assert.equal(r.text, '{"ok":true}');
  assert.deepEqual(r.usage, { input: 10, output: 5 });
  const call = gw.seen[0];
  assert.equal(call.url, "/v1/chat/completions");
  assert.equal(call.headers.authorization, "Bearer k-123");
  const body = JSON.parse(call.body);
  assert.equal(body.model, "my-model");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(body.messages[0].role, "system");
  gw.close();
});

test("a gateway that rejects JSON mode is asked again without it", async () => {
  let n = 0;
  const gw = await serve((_r, b, res) => (++n === 1 && JSON.parse(b).response_format ? reply(res, 400, { error: "response_format is not supported" }) : reply(res, 200, openai("{}"))));
  env({ GATEWAY_API_URL: gw.url, GATEWAY_API_KEY: "k", GATEWAY_MODEL: "m" });
  await chatGateway({ system: "s", user: "u", json: true });
  assert.equal(gw.seen.length, 2);
  assert.equal(JSON.parse(gw.seen[1].body).response_format, undefined);
  gw.close();
});

test("a custom key header and extra headers are honoured", async () => {
  const gw = await serve((_r, _b, res) => reply(res, 200, openai("hi")));
  env({ GATEWAY_API_URL: gw.url + "/v1/chat/completions", GATEWAY_API_KEY: "azure-key", GATEWAY_MODEL: "m", GATEWAY_API_KEY_HEADER: "api-key", GATEWAY_EXTRA_HEADERS: '{"x-team":"growth"}' });
  await chatGateway({ system: "s", user: "u" });
  assert.equal(gw.seen[0].headers["api-key"], "azure-key");
  assert.equal(gw.seen[0].headers.authorization, undefined);
  assert.equal(gw.seen[0].headers["x-team"], "growth");
  env({ GATEWAY_API_KEY_HEADER: undefined, GATEWAY_EXTRA_HEADERS: undefined });
  gw.close();
});

test("an Anthropic style gateway gets the Messages shape", async () => {
  const gw = await serve((_r, _b, res) => reply(res, 200, { model: "claude-x", content: [{ type: "text", text: "hello" }], usage: { input_tokens: 7, output_tokens: 3 } }));
  env({ GATEWAY_API_URL: gw.url + "/anthropic/v1/messages", GATEWAY_API_KEY: "k9", GATEWAY_MODEL: "claude-x" });
  const r = await chatGateway({ system: "sys", user: "usr" });
  assert.equal(r.text, "hello");
  assert.deepEqual(r.usage, { input: 7, output: 3 });
  const body = JSON.parse(gw.seen[0].body);
  assert.equal(body.system, "sys");
  assert.equal(body.messages[0].content, "usr");
  assert.equal(gw.seen[0].headers["x-api-key"], "k9");
  assert.equal(gw.seen[0].headers["anthropic-version"], "2023-06-01");
  gw.close();
});

test("gateway errors say what to check", async () => {
  const gw = await serve((_r, _b, res) => reply(res, 401, { error: "bad key" }));
  env({ GATEWAY_API_URL: gw.url, GATEWAY_API_KEY: "wrong", GATEWAY_MODEL: "m" });
  await assert.rejects(chatGateway({ system: "s", user: "u" }), /rejected our key.*GATEWAY_API_KEY/);
  env({ GATEWAY_MODEL: undefined });
  await assert.rejects(chatGateway({ system: "s", user: "u" }), /GATEWAY_MODEL is not set/);
  gw.close();
});

test("llmJson validates, and repairs one bad answer", async () => {
  const schema = z.object({ title: z.string(), n: z.number() });
  let calls = 0;
  const gw = await serve((_r, b, res) => {
    calls++;
    const sys = JSON.parse(b).messages[0].content as string;
    assert.match(sys, /JSON schema/);
    reply(res, 200, openai(calls === 1 ? '```json\n{"title": "x"}\n```' : '```json\n{"title":"x","n":4}\n```'));
  });
  env({ GATEWAY_API_URL: gw.url, GATEWAY_API_KEY: "k", GATEWAY_MODEL: "m", LLM_PROVIDER: undefined });
  const r = await llmJson(schema, { system: "s", user: "u" });
  assert.deepEqual(r.data, { title: "x", n: 4 });
  assert.equal(calls, 2);
  assert.equal(r.via, "gateway");
  gw.close();
  const bad = await serve((_r, _b, res) => reply(res, 200, openai("not json at all")));
  env({ GATEWAY_API_URL: bad.url });
  await assert.rejects(llmJson(schema, { system: "s", user: "u" }), /format we asked for/);
  bad.close();
});

test("status prefers the gateway, then Copilot, then says nothing is set up", async () => {
  const mem = (c: CopilotConnection | null): Store => ({ get: async () => c, set: async () => {}, clear: async () => {} });
  env({ GATEWAY_API_URL: "https://gw.example.com/v1", GATEWAY_API_KEY: "k", GATEWAY_MODEL: "m", LLM_PROVIDER: undefined });
  assert.equal((await llmStatus(mem(null))).kind, "gateway");
  assert.match((await llmStatus(mem(null))).label, /gw.example.com/);
  env({ GATEWAY_API_URL: undefined, GATEWAY_API_KEY: undefined });
  assert.equal((await llmStatus(mem({ githubToken: "t", login: "octo" }))).kind, "copilot");
  assert.equal((await llmStatus(mem(null))).kind, null);
});

test("Copilot: device sign in, token exchange, caching and chat", async () => {
  let polls = 0, exchanges = 0;
  const gh = await serve((req, b, res) => {
    if (req.url === "/login/device/code") return reply(res, 200, { device_code: "dev1", user_code: "ABCD-1234", verification_uri: "https://github.com/login/device", expires_in: 900, interval: 5 });
    if (req.url === "/login/oauth/access_token") return reply(res, 200, ++polls < 3 ? { error: "authorization_pending" } : { access_token: "gho_abc" });
    if (req.url === "/user") return reply(res, 200, { login: "octocat" });
    if (req.url === "/copilot_internal/v2/token") { exchanges++; return reply(res, 200, { token: `cop-${exchanges}`, expires_at: Math.floor(Date.now() / 1000) + 1800, endpoints: { api: `http://127.0.0.1:${(gh.port)}` } }); }
    if (req.url === "/chat/completions") return reply(res, 200, openai('{"a":1}'));
    reply(res, 404, {});
  }) as Awaited<ReturnType<typeof serve>> & { port: number };
  gh.port = Number(new URL(gh.url).port);
  env({ GITHUB_BASE_URL: gh.url, GITHUB_API_URL: gh.url, GATEWAY_API_URL: undefined, GATEWAY_API_KEY: undefined, GATEWAY_MODEL: undefined, COPILOT_MODEL: "gpt-4.1" });
  let saved: CopilotConnection | null = null;
  const store: Store = { get: async () => saved, set: async (c) => { saved = c; }, clear: async () => { saved = null; } };

  const d = await startDeviceFlow();
  assert.equal(d.userCode, "ABCD-1234");
  assert.equal(JSON.parse(gh.seen[0].body).scope, "read:user");
  assert.equal((await pollDeviceFlow(d.deviceCode, store)).status, "pending");
  assert.equal((await pollDeviceFlow(d.deviceCode, store)).status, "pending");
  const done = await pollDeviceFlow(d.deviceCode, store);
  assert.deepEqual([done.status, done.login], ["done", "octocat"]);
  assert.equal(saved!.githubToken, "gho_abc");

  const s1 = await copilotSession(store);
  const s2 = await copilotSession(store);
  assert.equal(s1.token, "cop-1");
  assert.equal(s2.token, "cop-1", "the short lived token is reused");
  assert.equal(exchanges, 1);
  assert.equal(gh.seen.find((c) => c.url === "/copilot_internal/v2/token")!.headers.authorization, "token gho_abc");

  saved = { ...saved!, expiresAt: Math.floor(Date.now() / 1000) + 10 }; // about to expire
  assert.equal((await copilotSession(store)).token, "cop-2");

  const r = await llmJson(z.object({ a: z.number() }), { system: "s", user: "u" }, store);
  assert.deepEqual(r.data, { a: 1 });
  assert.equal(r.via, "copilot");
  const chat = gh.seen.filter((c) => c.url === "/chat/completions").pop()!;
  assert.equal(chat.headers.authorization, "Bearer cop-2");
  assert.equal(chat.headers["copilot-integration-id"], "vscode-chat");
  assert.equal(JSON.parse(chat.body).model, "gpt-4.1");
  gh.close();
});

test("Copilot: a denied or expired sign in and a missing plan give readable errors", async () => {
  const gh = await serve((req, _b, res) => {
    if (req.url === "/login/oauth/access_token") return reply(res, 200, { error: "access_denied" });
    if (req.url === "/copilot_internal/v2/token") return reply(res, 404, {});
    reply(res, 404, {});
  });
  env({ GITHUB_BASE_URL: gh.url, GITHUB_API_URL: gh.url });
  const store: Store = { get: async () => ({ githubToken: "t", login: "x" }), set: async () => {}, clear: async () => {} };
  assert.match((await pollDeviceFlow("d", store)).message!, /cancelled/);
  await assert.rejects(copilotSession(store), /Copilot plan/);
  gh.close();
});

test("model list addresses and shapes", () => {
  assert.deepEqual(modelsUrls("https://h.io/v1/chat/completions"), ["https://h.io/v1/models", "https://h.io/models"]);
  assert.equal(modelsUrls("https://h.io")[0], "https://h.io/v1/models");
  assert.ok(modelsUrls("https://h.io/api/v1")[0] === "https://h.io/api/v1/models");
  assert.deepEqual(parseModelList({ data: [{ id: "b" }, { id: "a" }, { id: "a" }] }), ["a", "b"]);
  assert.deepEqual(parseModelList({ models: [{ name: "x" }, "y"] }), ["x", "y"]);
  assert.deepEqual(parseModelList(["q"]), ["q"]);
  assert.deepEqual(parseModelList({ nothing: 1 }), []);
});

test("models are listed from the gateway, falling back across addresses", async () => {
  const s = await serve((req, _b, res) => {
    if (req.url === "/models" && req.headers.authorization === "Bearer k1") return reply(res, 200, { data: [{ id: "gpt-x" }, { id: "claude-y" }] });
    reply(res, 404, { error: "no" });
  });
  const ids = await listGatewayModels({ url: `${s.url}/v1/chat/completions`, key: "k1" });
  assert.deepEqual(ids, ["claude-y", "gpt-x"]);
  await assert.rejects(listGatewayModels({ url: s.url, key: "wrong" }), /could not get a model list/);
  s.close();
});

test("a rejected key is reported on the model list", async () => {
  const s = await serve((_r, _b, res) => reply(res, 401, { error: "bad key" }));
  await assert.rejects(listGatewayModels({ url: s.url, key: "z" }), /rejected our key/);
  s.close();
});

test("local addresses are recognised and explained", async () => {
  assert.ok(isLocalAddress("http://localhost:20127/v1"));
  assert.ok(isLocalAddress("http://192.168.1.5/v1"));
  assert.ok(!isLocalAddress("https://gateway.example.com/v1"));
  await assert.rejects(listGatewayModels({ url: "http://127.0.0.1:1/v1", key: "k" }), /cannot reach it/);
});

test("streamed and odd chat answers are still read", async () => {
  const sse = 'data: {"model":"m","choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n';
  assert.equal(parseChatBody(sse, "openai")?.text, "Hello");
  const ant = 'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"text":"OK"}}\n';
  assert.equal(parseChatBody(ant, "anthropic")?.text, "OK");
  assert.equal(parseChatBody('{"choices":[{"text":"legacy"}]}', "openai")?.text, "legacy");
  assert.equal(parseChatBody("<html>Cloudflare</html>", "openai"), null);
});

test("a non chat answer is reported with its status and start", async () => {
  const s = await serve((_r, _b, res) => { res.setHeader("content-type", "text/html"); res.end("<html>Tunnel page</html>"); });
  await assert.rejects(chatGateway({ system: "s", user: "u" }, { url: s.url + "/v1", key: "k", model: "m" }), /HTTP 200, text\/html.*Tunnel page/);
  s.close();
});

test("a model chosen for one request replaces the saved one", async () => {
  const gw = await serve((_r, _b, res) => reply(res, 200, openai("ok")));
  env({ GATEWAY_API_URL: gw.url + "/v1", GATEWAY_API_KEY: "k", GATEWAY_MODEL: "saved-model" });
  await chatGateway({ system: "s", user: "u", model: "picked-model" });
  await chatGateway({ system: "s", user: "u" });
  assert.equal(JSON.parse(gw.seen[0].body).model, "picked-model");
  assert.equal(JSON.parse(gw.seen[1].body).model, "saved-model");
  gw.close();
});

test("a model that only streams still answers, and we remember that", async () => {
  const gw = await serve((_r, body, res) => {
    const b = JSON.parse(body);
    if (b.stream !== true) return reply(res, 400, { error: "this model only supports stream: true" });
    res.setHeader("content-type", "text/event-stream");
    res.end('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n');
  });
  const cfg = { url: gw.url + "/v1", key: "k", model: "stream-only" };
  assert.equal((await chatGateway({ system: "s", user: "u" }, cfg)).text, "Hello");
  const firstRun = gw.seen.length;
  assert.equal((await chatGateway({ system: "s", user: "u" }, cfg)).text, "Hello");
  assert.equal(gw.seen.length - firstRun, 1, "the second question goes straight to the shape that works");
  gw.close();
});

test("a model that refuses max_tokens is asked with max_completion_tokens", async () => {
  const gw = await serve((_r, body, res) => {
    const b = JSON.parse(body);
    if (b.max_tokens !== undefined) return reply(res, 400, { error: "Unsupported parameter: max_tokens. Use max_completion_tokens instead." });
    if (b.stream === true) return reply(res, 400, { error: "no streaming" });
    reply(res, 200, openai("fine"));
  });
  const r = await chatGateway({ system: "s", user: "u", json: true }, { url: gw.url + "/v1", key: "k", model: "newer" });
  assert.equal(r.text, "fine");
  assert.ok(gw.seen.some((x) => JSON.parse(x.body).max_completion_tokens === 4000));
  gw.close();
});

test("a model that only accepts a bare request gets one", async () => {
  const gw = await serve((_r, body, res) => {
    const b = JSON.parse(body);
    if (b.max_tokens !== undefined || b.max_completion_tokens !== undefined || b.stream !== undefined || b.response_format) return reply(res, 500, { error: "upstream exploded" });
    reply(res, 200, openai("bare"));
  });
  assert.equal((await chatGateway({ system: "s", user: "u" }, { url: gw.url + "/v1", key: "k", model: "picky" })).text, "bare");
  gw.close();
});

test("a wrong key is reported at once, and a model that never answers lists what we tried", async () => {
  const bad = await serve((_r, _b, res) => reply(res, 401, { error: "no" }));
  await assert.rejects(chatGateway({ system: "s", user: "u" }, { url: bad.url + "/v1", key: "k", model: "m" }), /rejected our key/);
  assert.equal(bad.seen.length, 1);
  bad.close();
  const dead = await serve((_r, _b, res) => reply(res, 500, { error: "model overloaded" }));
  await assert.rejects(chatGateway({ system: "s", user: "u" }, { url: dead.url + "/v1", key: "k", model: "dead" }), /HTTP 500.*overloaded.*tried 3 other request formats.*streamed.*minimal/s);
  dead.close();
});

import { formatChoice, parseChoice } from "./choice.ts";
test("a picked model names its source", () => {
  assert.equal(formatChoice("copilot", "gpt-4.1"), "copilot::gpt-4.1");
  assert.deepEqual(parseChoice("copilot::gpt-4.1"), { provider: "copilot", model: "gpt-4.1" });
  assert.deepEqual(parseChoice("gateway::claude-free-3.7"), { provider: "gateway", model: "claude-free-3.7" });
  assert.deepEqual(parseChoice("claude-Code"), { model: "claude-Code" });
  assert.deepEqual(parseChoice("other::x"), { model: "other::x" });
  assert.deepEqual(parseChoice(""), {});
  assert.deepEqual(parseChoice(undefined), {});
});

import { unsupportedModel } from "./gateway.ts";
test("a model the gateway cannot map is explained once, without retries", async () => {
  const body = JSON.stringify({ error: { message: '[400]: {\n "error": {\n "code": "400",\n "message": "Unsupported model mimo-auto"\n }\n}\n', type: "invalid_request_error" } });
  const gw = await serve((_r, _b, res) => { res.statusCode = 400; res.end(body); });
  await assert.rejects(chatGateway({ system: "s", user: "u" }, { url: gw.url + "/v1", key: "k", model: "claude-free" }), /cannot use the model "claude-free".*Unsupported model mimo-auto.*inside the gateway/s);
  assert.equal(gw.seen.length, 1, "no pointless retries");
  gw.close();
  assert.match(unsupportedModel("m", "Model xyz not found"), /not found/);
});
