import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { authorizeUrl, exchangeCode, redirectUri, replyLinkedin, type LinkedinConn } from "./linkedin.ts";

async function mock() {
  const seen: { method: string; url: string; headers: Record<string, unknown>; body: string }[] = [];
  const srv = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ method: req.method!, url: req.url!, headers: req.headers, body });
      res.setHeader("content-type", "application/json");
      if (req.url === "/oauth/v2/accessToken") return res.end(JSON.stringify({ access_token: "li-token", expires_in: 5184000 }));
      if (req.url === "/v2/userinfo") return res.end(JSON.stringify({ sub: "abc123", name: "Nishanta Banik" }));
      if (req.url!.startsWith("/rest/socialActions/")) { res.statusCode = 201; res.setHeader("x-restli-id", "urn:li:comment:(urn:li:activity:1,999)"); return res.end("{}"); }
      res.statusCode = 404; res.end("{}");
    });
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
  Object.assign(process.env, { LINKEDIN_AUTH_BASE: url, LINKEDIN_API_BASE: url, LINKEDIN_CLIENT_ID: "cid", LINKEDIN_CLIENT_SECRET: "sec", APP_URL: "" });
  return { seen, close: () => srv.close() };
}

test("the sign in link carries our app, redirect and the comment permission", () => {
  process.env.LINKEDIN_CLIENT_ID = "cid";
  process.env.APP_URL = "";
  const u = new URL(authorizeUrl("https://app.example.com", "st123"));
  assert.equal(u.searchParams.get("client_id"), "cid");
  assert.equal(u.searchParams.get("redirect_uri"), "https://app.example.com/api/connect/linkedin/callback");
  assert.equal(u.searchParams.get("state"), "st123");
  assert.match(u.searchParams.get("scope")!, /w_member_social/);
  process.env.APP_URL = "https://custom.example.com/";
  assert.equal(redirectUri("https://ignored"), "https://custom.example.com/api/connect/linkedin/callback");
  process.env.APP_URL = "";
});

test("a code becomes a connection with the member's URN", async () => {
  const m = await mock();
  const c = await exchangeCode("the-code", "https://app.example.com");
  assert.equal(c.accessToken, "li-token");
  assert.equal(c.personUrn, "urn:li:person:abc123");
  assert.equal(c.name, "Nishanta Banik");
  assert.ok(c.expiresAt > Date.now() / 1000 + 5_000_000);
  const form = new URLSearchParams(m.seen[0].body);
  assert.deepEqual([form.get("grant_type"), form.get("code"), form.get("client_secret")], ["authorization_code", "the-code", "sec"]);
  m.close();
});

test("a reply goes under the comment, with the headers LinkedIn expects", async () => {
  const m = await mock();
  const conn: LinkedinConn = { accessToken: "li-token", expiresAt: Math.floor(Date.now() / 1000) + 1000, personUrn: "urn:li:person:abc123", name: "N" };
  const id = await replyLinkedin(conn, { postUrn: "urn:li:activity:1", parentCommentUrn: "urn:li:comment:(urn:li:activity:1,500)", text: "Thanks for this!" });
  assert.equal(id, "urn:li:comment:(urn:li:activity:1,999)");
  const call = m.seen[0];
  assert.equal(call.url, "/rest/socialActions/urn%3Ali%3Aactivity%3A1/comments");
  assert.equal(call.headers.authorization, "Bearer li-token");
  assert.equal(call.headers["x-restli-protocol-version"], "2.0.0");
  assert.ok(call.headers["linkedin-version"]);
  assert.deepEqual(JSON.parse(call.body), { actor: "urn:li:person:abc123", object: "urn:li:activity:1", message: { text: "Thanks for this!" }, parentComment: "urn:li:comment:(urn:li:activity:1,500)" });
  m.close();
});

test("an expired connection says so before calling LinkedIn", async () => {
  const conn: LinkedinConn = { accessToken: "x", expiresAt: 1, personUrn: "urn:li:person:a", name: "N" };
  await assert.rejects(replyLinkedin(conn, { postUrn: "urn:li:activity:1", text: "hi" }), /expired/);
});
