import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { oauth1Header, enc } from "./oauth1.ts";
import { mentionsToComments, xMe, xMentions, xReply } from "./x.ts";

test("the OAuth 1.0a signature matches the example published in Twitter's documentation", () => {
  const header = oauth1Header(
    "POST", "https://api.twitter.com/1.1/statuses/update.json",
    { include_entities: "true", status: "Hello Ladies + Gentlemen, a signed OAuth request!" },
    { key: "xvz1evFS4wEEPTGEFPHBog", secret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw", token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", tokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE" },
    { nonce: "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", timestamp: "1318622958" },
  );
  assert.match(header, /oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"/);
  assert.match(header, /^OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog"/);
});

test("percent encoding follows RFC 3986", () => {
  assert.equal(enc("a b!*'()~"), "a%20b%21%2A%27%28%29~");
});

const tweets = {
  data: [
    { id: "900", text: "@me great point, how did you measure it?", author_id: "u2", created_at: "2026-10-04T10:00:00Z", conversation_id: "100", referenced_tweets: [{ type: "replied_to", id: "100" }], public_metrics: { like_count: 3 } },
    { id: "901", text: "@me nested reply", author_id: "u3", created_at: "2026-10-04T11:00:00Z", conversation_id: "100", referenced_tweets: [{ type: "replied_to", id: "900" }] },
    { id: "902", text: "my own follow up", author_id: "me", conversation_id: "100" },
    { id: "903", text: "@me random mention", author_id: "u4", conversation_id: "903" },
  ],
  includes: { users: [{ id: "u2", username: "ana", name: "Ana" }, { id: "u3", username: "ben", name: "Ben" }, { id: "u4", username: "cy", name: "Cy" }] },
  meta: { newest_id: "903", result_count: 4 },
};

test("mentions become comments on our posts, skipping our own tweets", () => {
  const m = { tweets: tweets.data, users: new Map(tweets.includes.users.map((u) => [u.id, u])), newestId: "903" };
  const list = mentionsToComments(m, "me", (id) => (id === "100" ? { id: "post-1" } : null));
  assert.equal(list.length, 3);
  assert.deepEqual([list[0].postId, list[0].authorHandle, list[0].externalId, list[0].likes], ["post-1", "@ana", "900", 3]);
  assert.equal(list[0].commentUrl, "https://x.com/ana/status/900");
  assert.equal(list[1].postId, "post-1", "a nested reply stays with the post of its conversation");
  assert.equal(list[2].postId, null, "a plain mention belongs to no post of ours");
});

test("the X client signs requests, asks only for new mentions and replies in a thread", async () => {
  const seen: { method: string; url: string; auth: string; body: string }[] = [];
  const srv = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ method: req.method!, url: req.url!, auth: String(req.headers.authorization), body });
      res.setHeader("content-type", "application/json");
      if (req.url === "/2/users/me") return res.end(JSON.stringify({ data: { id: "me", username: "me", name: "Me" } }));
      if (req.url!.startsWith("/2/users/me/mentions")) return res.end(JSON.stringify(tweets));
      if (req.url === "/2/tweets") return res.end(JSON.stringify({ data: { id: "777" } }));
      res.statusCode = 402; res.end("{}");
    });
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { X_API_BASE: `http://127.0.0.1:${(srv.address() as { port: number }).port}`, X_API_KEY: "k", X_API_SECRET: "s", X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts" });

  assert.equal((await xMe()).username, "me");
  const r = await xMentions("me", "800", 50);
  assert.equal(r.tweets.length, 4);
  assert.equal(r.newestId, "903");
  const q = new URL("http://x" + seen[1].url).searchParams;
  assert.equal(q.get("since_id"), "800");
  assert.equal(q.get("max_results"), "50");
  assert.match(q.get("tweet.fields")!, /conversation_id/);
  assert.match(seen[1].auth, /^OAuth /);
  assert.match(seen[1].auth, /oauth_signature="/);

  assert.equal(await xReply("Thanks Ana!", "900"), "777");
  assert.deepEqual(JSON.parse(seen[2].body), { text: "Thanks Ana!", reply: { in_reply_to_tweet_id: "900" } });
  assert.equal(seen[2].method, "POST");

  srv.close();
});

test("credit and permission problems are explained", async () => {
  const srv = createServer((_q, res) => { res.statusCode = 403; res.end("{}"); });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  process.env.X_API_BASE = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
  await assert.rejects(xMe(), /Read and write permission/);
  srv.close();
});
