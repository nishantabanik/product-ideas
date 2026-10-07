import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { extractComments, suggestReplies } from "./suggest.ts";

async function gateway(answer: unknown) {
  const seen: { system: string; user: string }[] = [];
  const srv = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const b = JSON.parse(body);
      seen.push({ system: b.messages[0].content, user: b.messages[1].content });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ model: "m", choices: [{ message: { content: JSON.stringify(answer) } }] }));
    });
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  Object.assign(process.env, { GATEWAY_API_URL: `http://127.0.0.1:${(srv.address() as { port: number }).port}/v1`, GATEWAY_API_KEY: "k", GATEWAY_MODEL: "m", LLM_PROVIDER: "" });
  return { seen, close: () => srv.close() };
}

test("three reply options come back, and X replies are cut to 280 characters", async () => {
  const long = "x".repeat(400);
  const g = await gateway({ replies: [{ tone: "short thanks", text: "Thanks!" }, { tone: "adds something", text: long }, { tone: "question", text: "What did you try?" }, { tone: "extra", text: "ignored" }] });
  const r = await suggestReplies({ platform: "x", comment: "great point", author: "Ana", postText: "Our pricing test" });
  assert.equal(r.length, 3);
  assert.equal(r[1].text.length, 280);
  assert.match(g.seen[0].system, /under 270 characters/);
  assert.match(g.seen[0].user, /Our pricing test/);
  assert.match(g.seen[0].user, /great point/);
  g.close();
});

test("smart paste returns only comments with text", async () => {
  const g = await gateway({ comments: [{ author: "Jane Doe", text: "Great post", when: "2d" }, { author: "Sam", text: "  " }, { author: "", text: "Hello", when: null }] });
  const r = await extractComments("messy page text");
  assert.deepEqual(r.map((c) => [c.author, c.body, c.when]), [["Jane Doe", "Great post", "2d"], ["Unknown", "Hello", null]]);
  assert.match(g.seen[0].system, /Never add or invent/);
  g.close();
});

test("nudges: three lines from the model, X cut to 280, and fixed lines without a model", async () => {
  const { suggestNudges, fallbackNudges } = await import("./suggest.ts");
  const g = await gateway({ lines: ["Just checking in", "y".repeat(400), "Happy to help", "extra"] });
  const r = await suggestNudges({ platform: "x", kind: "dm", author: "Ana", theirMessage: "Can you share the deck?", ourReply: "Sure, sent", days: 4 });
  assert.equal(r.length, 3);
  assert.equal(r[1].length, 280);
  assert.match(g.seen[0].system, /4 days/);
  assert.match(g.seen[0].user, /share the deck/);
  g.close();
  const empty = await gateway({ lines: ["  "] });
  assert.deepEqual(await suggestNudges({ platform: "linkedin", kind: "comment", author: "A", theirMessage: "x", ourReply: null, days: 3 }), fallbackNudges("linkedin"));
  empty.close();
  assert.equal(fallbackNudges("x").length, 3);
});
