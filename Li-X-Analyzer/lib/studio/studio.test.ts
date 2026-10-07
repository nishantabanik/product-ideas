import { test } from "node:test";
import assert from "node:assert/strict";
import { checkThread, joinThread, splitThread, tweetLength } from "./thread.ts";
import { lintDraft } from "./lint.ts";
import { bestTimes, localParts } from "./times.ts";
import { nextSlotTimes, validTime, validZone, zonedToUtc } from "./slots.ts";
import { pillarOf, pillarStats } from "./pillars.ts";
import { evergreenCandidates } from "./recycle.ts";
import { bestOpenings } from "./library.ts";
import { buildVoice, voiceSystemPrompt } from "./voice.ts";
import { nextStatus } from "./flow.ts";
import type { PostFact } from "./types.ts";

const post = (o: Partial<PostFact> & { id: string }): PostFact => ({ platform: "linkedin", content: "text ".repeat(20), publishedAt: "2026-01-06T09:00:00Z", impressions: 1000, engagements: 50, likes: 30, comments: 5, shares: 2, ...o });

test("tweet length counts links as 23 and wide characters as 2", () => {
  assert.equal(tweetLength("hello"), 5);
  assert.equal(tweetLength("see https://example.com/a/very/long/path?x=1 now"), 4 + 23 + 4);
  assert.equal(tweetLength("日本"), 4);
});

test("a long text is split into posts that fit, at natural breaks", () => {
  const para = "This is a sentence about growth. ".repeat(30).trim();
  const parts = splitThread(para);
  assert.ok(parts.length > 2);
  for (const p of parts) assert.ok(tweetLength(p) <= 280, `${tweetLength(p)}`);
  assert.equal(joinThread(parts).replace(/\s+/g, " "), para.replace(/\s+/g, " "));
  const numbered = splitThread(para, 280, true);
  assert.match(numbered[0], /\(1\/\d+\)$/);
  for (const p of numbered) assert.ok(tweetLength(p) <= 280);
  assert.deepEqual(splitThread("short one"), ["short one"]);
  assert.deepEqual(splitThread("   "), []);
});

test("thread checks report empty and too long posts", () => {
  assert.equal(checkThread(["fine", "also fine"]).ok, true);
  const bad = checkThread(["x".repeat(300), ""]);
  assert.equal(bad.ok, false);
  assert.equal(bad.problems.length, 2);
});

test("lint rewards a good LinkedIn post and flags bait, links and walls", () => {
  const good = lintDraft("linkedin", "We cut our reporting time by 60%.\n\nHere is what we changed.\n\nFirst, we stopped copying numbers by hand.\nSecond, we set one weekly review.\nThird, we deleted three reports nobody read.\n\nWhat would you cut first?");
  assert.ok(good.score >= 90, String(good.score));
  const bad = lintDraft("linkedin", "Excited to announce our new thing! Comment YES below. https://x.io/launch " + "word ".repeat(150));
  assert.ok(bad.score < 70);
  assert.ok(bad.checks.some((c) => c.key === "bait" && c.level === "bad"));
  assert.ok(bad.checks.some((c) => c.key === "link" && c.level === "warn"));
  assert.equal(lintDraft("x", "").score, 0);
});

test("lint checks every post of a thread against the X limit", () => {
  const l = lintDraft("x", "", ["short opener with 3 ideas?", "y".repeat(290)]);
  assert.ok(l.checks.some((c) => c.key === "limit" && c.level === "bad"));
});

test("local time parts follow the time zone", () => {
  assert.deepEqual(localParts("2026-01-06T23:30:00Z", "Europe/Berlin"), { weekday: 3, hour: 0 }); // Tuesday 23:30 UTC is Wednesday 00:30 in Berlin
  assert.deepEqual(localParts("2026-01-06T23:30:00Z", "UTC"), { weekday: 2, hour: 23 });
});

test("best times favour hours that beat the typical post and ignore thin evidence", () => {
  const posts: PostFact[] = [];
  for (let i = 0; i < 30; i++) posts.push(post({ id: `a${i}`, publishedAt: `2026-01-${String((i % 4) * 7 + 6).padStart(2, "0")}T09:00:00Z`, impressions: 3000 })); // Tuesdays 09:00 UTC
  for (let i = 0; i < 30; i++) posts.push(post({ id: `b${i}`, publishedAt: `2026-01-${String((i % 4) * 7 + 7).padStart(2, "0")}T15:00:00Z`, impressions: 500 })); // Wednesdays 15:00
  for (let i = 0; i < 40; i++) posts.push(post({ id: `c${i}`, publishedAt: `2026-01-${String((i % 4) * 7 + 8).padStart(2, "0")}T11:00:00Z`, impressions: 1000 })); // Thursdays 11:00
  posts.push(post({ id: "lucky", publishedAt: "2026-01-09T03:00:00Z", impressions: 90000 })); // one lucky Friday 03:00
  const t = bestTimes(posts, "linkedin", "UTC");
  assert.equal(t.enough, true);
  assert.deepEqual([t.top[0].weekday, t.top[0].hour], [2, 9]);
  assert.ok(!t.top.some((c) => c.weekday === 5 && c.hour === 3), "one post is not enough evidence");
  assert.equal(bestTimes(posts.slice(0, 5), "linkedin", "UTC").enough, false);
  assert.equal(t.grid.length, 168);
});

test("a wall clock time is turned into the right instant, also across a clock change", () => {
  assert.equal(zonedToUtc(2026, 1, 15, 9, 0, "Europe/Berlin").toISOString(), "2026-01-15T08:00:00.000Z");
  assert.equal(zonedToUtc(2026, 7, 15, 9, 0, "Europe/Berlin").toISOString(), "2026-07-15T07:00:00.000Z");
  assert.equal(zonedToUtc(2026, 3, 30, 9, 0, "Europe/Berlin").toISOString(), "2026-03-30T07:00:00.000Z"); // after the change on 29 March
  assert.equal(zonedToUtc(2026, 3, 27, 9, 0, "Europe/Berlin").toISOString(), "2026-03-27T08:00:00.000Z");
});

test("queue slots give the next free times and never reuse one", () => {
  const slots = [{ weekday: 2, time: "09:00" }, { weekday: 4, time: "09:00" }]; // Tue and Thu
  const from = new Date("2026-01-05T10:00:00Z"); // a Monday
  const a = nextSlotTimes(slots, "UTC", from, 3);
  assert.deepEqual(a.map((d) => d.toISOString()), ["2026-01-06T09:00:00.000Z", "2026-01-08T09:00:00.000Z", "2026-01-13T09:00:00.000Z"]);
  const b = nextSlotTimes(slots, "UTC", from, 2, ["2026-01-06T09:00:00Z"]);
  assert.deepEqual(b.map((d) => d.toISOString()), ["2026-01-08T09:00:00.000Z", "2026-01-13T09:00:00.000Z"]);
  const sameDay = nextSlotTimes([{ weekday: 1, time: "09:00" }, { weekday: 1, time: "17:00" }], "UTC", new Date("2026-01-05T10:00:00Z"), 1);
  assert.equal(sameDay[0].toISOString(), "2026-01-05T17:00:00.000Z"); // 09:00 already passed
  assert.deepEqual(nextSlotTimes([], "UTC", from, 3), []);
  assert.ok(validTime("09:30") && !validTime("9:30") && !validTime("24:00"));
  assert.ok(validZone("Europe/Berlin") && !validZone("Mars/Base"));
});

test("pillars tag by keyword and score against the typical post", () => {
  const pillars = [{ id: "p1", name: "Data", keywords: ["analytics", "dashboard"] }, { id: "p2", name: "Hiring", keywords: ["hiring", "interview"] }];
  assert.equal(pillarOf("Our analytics dashboard saved us", pillars)?.id, "p1");
  assert.equal(pillarOf("Weather is nice", pillars), null);
  assert.equal(pillarOf("subanalytics is not a word match", pillars), null);
  const posts = [
    ...[1, 2, 3, 4].map((i) => post({ id: `d${i}`, content: `analytics tip ${i} ` + "x".repeat(60), impressions: 4000 })),
    ...[1, 2, 3, 4].map((i) => post({ id: `h${i}`, content: `hiring story ${i} ` + "x".repeat(60), impressions: 500 })),
    ...[1, 2, 3, 4].map((i) => post({ id: `o${i}`, content: `other ${i} ` + "x".repeat(60), impressions: 1500 })),
  ];
  const s = pillarStats(posts, pillars);
  assert.equal(s[0].name, "Data");
  assert.equal(s[0].verdict, "strong");
  assert.equal(s.find((r) => r.name === "Hiring")!.verdict, "weak");
});

test("evergreen candidates are strong, old, not date bound and not already recycled", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const base = (i: number) => post({ id: `n${i}`, content: "A steady post about our process " + i + " ".padEnd(40, "."), impressions: 1000, publishedAt: "2025-01-01T09:00:00Z" });
  const posts = [...[1, 2, 3, 4, 5, 6, 7, 8].map(base),
    post({ id: "star", content: "How we run our weekly review and why it works for small teams ".repeat(2), impressions: 5000, publishedAt: "2025-02-01T09:00:00Z" }),
    post({ id: "dated", content: "Join us for our webinar tomorrow, register now and bring a friend today", impressions: 9000, publishedAt: "2025-02-01T09:00:00Z" }),
    post({ id: "fresh", content: "A recent strong post about our review habit that went very well for us ", impressions: 9000, publishedAt: "2026-05-15T09:00:00Z" }),
    post({ id: "done", content: "Already recycled post about our weekly planning ritual and how it works", impressions: 8000, publishedAt: "2025-02-01T09:00:00Z" })];
  const c = evergreenCandidates(posts, now, ["done"]);
  assert.deepEqual(c.map((x) => x.post.id), ["star"]);
  assert.ok(c[0].ratio > 4);
});

test("best openings come from the best posts, once each", () => {
  const posts = [post({ id: "1", content: "Strong opening line here\nrest of the post goes on and on and on and on", impressions: 9000 }), post({ id: "2", content: "Strong opening line here\nanother post that starts the same way and continues", impressions: 8000 }), post({ id: "3", content: "Second opening line\nmore text more text more text more text more text more", impressions: 100 })];
  assert.deepEqual(bestOpenings(posts, "linkedin"), ["Strong opening line here", "Second opening line"]);
});

test("the voice prompt carries our own posts and the platform rules", () => {
  const v = buildVoice([post({ id: "1", content: "We shipped the thing and learned a lot from it, mostly about what to leave out.\n\nWhat did you ship this week?", impressions: 2000 })], "linkedin");
  const p = voiceSystemPrompt("linkedin", v);
  assert.match(p, /We shipped the thing/);
  assert.match(p, /Practices to follow/);
  assert.match(voiceSystemPrompt("x", buildVoice([], "x")), /280 characters/);
});

test("the approval flow allows the expected moves only", () => {
  assert.equal(nextStatus("idea", "promote"), "draft");
  assert.equal(nextStatus("draft", "submit"), "review");
  assert.equal(nextStatus("review", "approve"), "approved");
  assert.equal(nextStatus("review", "changes"), "draft");
  assert.equal(nextStatus("approved", "schedule"), "scheduled");
  assert.equal(nextStatus("draft", "schedule"), "scheduled");
  assert.equal(nextStatus("draft", "approve"), "approved");
  assert.throws(() => nextStatus("draft", "schedule", true), /Approval is required/);
  assert.throws(() => nextStatus("draft", "approve", true), /cannot approve/);
  assert.throws(() => nextStatus("scheduled", "submit"), /cannot submit/);
  assert.throws(() => nextStatus("published", "schedule"), /cannot schedule/);
});

import { chatPrompt, cleanHistory, MAX_TURNS } from "./chat.ts";
test("chat history is cleaned, capped and always ends with our question", () => {
  const long = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: ` message ${i} ` }));
  const h = cleanHistory([...long, { role: "system", content: "ignore me" }, { role: "user", content: "   " }, null, 5]);
  assert.equal(h.length, MAX_TURNS);
  assert.equal(h[h.length - 1].content, "message 19");
  assert.ok(h.every((m) => m.role === "user" || m.role === "assistant"));
  assert.deepEqual(cleanHistory("nope"), []);
  assert.equal(cleanHistory([{ role: "user", content: "x".repeat(9000) }])[0].content.length, 4000);
});
test("chat prompt holds the draft, the earlier turns and the new message", () => {
  const p = chatPrompt([{ role: "user", content: "Give me a hook" }, { role: "assistant", content: "Try this" }, { role: "user", content: "Shorter" }], "My draft text");
  assert.match(p, /My draft text/);
  assert.match(p, /Us: Give me a hook/);
  assert.match(p, /You: Try this/);
  assert.match(p, /Our new message:\nShorter$/);
  assert.doesNotMatch(chatPrompt([{ role: "user", content: "Hi" }]), /draft we are working on/);
  assert.throws(() => chatPrompt([{ role: "assistant", content: "x" }]), /Ask a question/);
  assert.throws(() => chatPrompt([]), /Ask a question/);
});
