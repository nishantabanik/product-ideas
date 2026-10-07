import assert from "node:assert/strict";
import { test } from "node:test";
import { breakdown, detectFormat, detectHook, standouts, verdictFor, type BreakdownPost } from "./breakdown.ts";

const post = (i: number, content: string, impressions: number | null, engagements: number | null = null, platform: "linkedin" | "x" = "linkedin"): BreakdownPost =>
  ({ id: `p${i}`, platform, content, impressions, engagements });
const pillars = [{ id: "a", name: "Hiring", keywords: ["hiring", "recruit"] }, { id: "b", name: "Sales", keywords: ["sales"] }];

test("format detectors", () => {
  assert.equal(detectFormat("Why pricing matters 🧵\n\nmore"), "thread");
  assert.equal(detectFormat("1/ Start here\n2/ Next"), "thread");
  assert.equal(detectFormat("Three tips:\n- one\n- two\n- three"), "list");
  assert.equal(detectFormat("1. a\n2. b\n3. c"), "list");
  assert.equal(detectFormat("- a\n- b"), "single");
  assert.equal(detectFormat("We shipped a thing.\nWhat would you do?"), "question");
  assert.equal(detectFormat("I started a company in 2019 and lost everything."), "story");
  assert.equal(detectFormat("I need more speed in the team."), "single");
  assert.equal(detectFormat("We believe in simple tools."), "single");
  assert.equal(detectFormat("Plain statement about work."), "single");
  assert.equal(detectFormat("Add 1/2 cup of sugar"), "single");
});

test("hook detectors", () => {
  assert.equal(detectHook("5 lessons from hiring"), "number");
  assert.equal(detectHook("How to run a standup"), "howto");
  assert.equal(detectHook("Do you review code?"), "question");
  assert.equal(detectHook("Most people hire too fast"), "claim");
  assert.equal(detectHook("Stop writing long posts"), "claim");
  assert.equal(detectHook("I hired badly once"), "personal");
  assert.equal(detectHook("We're hiring"), "personal");
  assert.equal(detectHook("Teams grow slowly"), "other");
  assert.equal(detectHook("🔥 Never skip the debrief"), "claim");
  assert.equal(detectHook(""), "other");
});

test("verdict rules", () => {
  assert.equal(verdictFor(3, 20, 2), "too few posts");
  assert.equal(verdictFor(4, 7, 2), "too few posts");
  assert.equal(verdictFor(4, 8, 1.25), "strong");
  assert.equal(verdictFor(4, 8, 0.75), "weak");
  assert.equal(verdictFor(4, 8, 1), "average");
});

test("thin data gives no verdicts and no standouts", () => {
  const b = breakdown([post(1, "Hello", 100), post(2, "World", 900)], pillars, "linkedin");
  assert.equal(b.enough, false);
  assert.equal(b.usable, 2);
  assert.ok(b.dimensions.every((d) => d.groups.every((g) => g.verdict === "too few posts")));
  assert.deepEqual(b.standouts, []);
});

test("posts without text or impressions are counted but not analysed", () => {
  const b = breakdown([post(1, "", 100), post(2, "  ", 100), post(3, "text", null), post(4, "text", 0), post(5, "ok", 50)], pillars, "linkedin");
  assert.equal(b.total, 5);
  assert.equal(b.withoutText, 2);
  assert.equal(b.withoutImpressions, 2);
  assert.equal(b.usable, 1);
});

test("all identical posts are all average", () => {
  const posts = Array.from({ length: 10 }, (_, i) => post(i, "Same text here", 500, 25));
  const b = breakdown(posts, pillars, "linkedin");
  assert.equal(b.overallMedian, 500);
  for (const d of b.dimensions) for (const g of d.groups) { assert.equal(g.ratio, 1); assert.equal(g.verdict, "average"); assert.equal(g.medianRate, 0.05); }
  assert.deepEqual(b.standouts, []);
});

test("strong and weak groups, ties and standouts", () => {
  const posts: BreakdownPost[] = [];
  let i = 0;
  for (let k = 0; k < 5; k++) posts.push(post(i++, `Hiring lesson number ${k} for teams`, 2000, 100)); // topic Hiring, strong
  for (let k = 0; k < 5; k++) posts.push(post(i++, `Sales note ${k} for teams`, 200, 4)); // Sales, weak
  for (let k = 0; k < 5; k++) posts.push(post(i++, `Plain note ${k}`, 1000, 20)); // untagged
  const b = breakdown(posts, pillars, "linkedin");
  assert.equal(b.overallMedian, 1000);
  const topic = b.dimensions[0].groups;
  assert.deepEqual(topic.map((g) => g.label), ["Hiring", "Sales", "Untagged"]);
  assert.equal(topic[0].verdict, "strong");
  assert.equal(topic[0].ratio, 2);
  assert.equal(topic[1].verdict, "weak");
  assert.equal(topic[2].verdict, "average");
  assert.ok(b.standouts.length >= 2 && b.standouts.length <= 3);
  assert.match(b.standouts[0], /Hiring/);
  assert.ok(b.standouts.some((s) => /Sales/.test(s)));
});

test("mixed platforms stay apart and length ranges differ", () => {
  const posts = [
    ...Array.from({ length: 8 }, (_, i) => post(i, "x".repeat(60), 100, 1, "x")),
    ...Array.from({ length: 8 }, (_, i) => post(100 + i, "y".repeat(700), 1000, 10, "linkedin")),
  ];
  const x = breakdown(posts, pillars, "x");
  const li = breakdown(posts, pillars, "linkedin");
  assert.equal(x.usable, 8);
  assert.equal(li.usable, 8);
  assert.equal(x.overallMedian, 100);
  assert.equal(x.dimensions[2].groups[0].label, "Short");
  assert.equal(x.dimensions[2].groups[0].detail, "under 100 characters");
  assert.equal(li.dimensions[2].groups[0].label, "Medium");
});

test("standouts never fire on thin evidence", () => {
  assert.deepEqual(standouts([{ id: "topic", title: "Topic", groups: [{ key: "a", label: "A", detail: null, posts: 9, medianImpressions: 9, medianRate: null, ratio: 3, verdict: "strong" }] }], 7), []);
});

test("engagement rate is null when no engagement data", () => {
  const b = breakdown(Array.from({ length: 8 }, (_, i) => post(i, "hello", 100)), pillars, "linkedin");
  assert.equal(b.overallRate, null);
});
