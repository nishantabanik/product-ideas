import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "./engine.ts";
import { textFeatures } from "./features.ts";
import { liftTable } from "./lift.ts";
import { PLAYBOOK } from "./playbook.ts";
import { buildContext } from "./context.ts";
import type { AdvisoryInput, DailyFact, PostFact, XWeek } from "./types.ts";

const NOW = "2026-10-05T08:00:00.000Z"; // a Monday
const D = 86_400_000;
const day = (back: number) => new Date(Date.parse("2026-10-04T00:00:00Z") - back * D).toISOString().slice(0, 10);

/** Daily LinkedIn numbers, oldest first. `f(daysAgo)` gives the impressions of that day. */
const daily = (n: number, f: (back: number) => number): DailyFact[] =>
  Array.from({ length: n }, (_, i) => { const back = n - 1 - i; const imp = Math.round(f(back)); return { day: day(back), impressions: imp, engagements: Math.round(imp * 0.05) }; });

const weeks = (imp: number[], mk?: (i: number) => Partial<XWeek>): XWeek[] =>
  imp.map((impressions, i) => ({ week: i + 1, impressions, likes: Math.round(impressions * 0.04), comments: Math.round(impressions * 0.004), shares: Math.round(impressions * 0.006), bookmarks: Math.round(impressions * 0.01), ...(mk?.(i) ?? {}) }));

const post = (id: string, platform: "linkedin" | "x", content: string, impressions: number | null, eng: number | null, back = 3, source = "postiz"): PostFact => ({
  id, platform, content, publishedAt: new Date(Date.parse(NOW) - back * D).toISOString(), url: null, impressions, engagements: eng, likes: null, comments: null, shares: null, clicks: null, source,
});

const base = (o: Partial<AdvisoryInput> = {}): AdvisoryInput => ({ now: NOW, posts: [], linkedinDaily: [], xWeeks: [], scheduled: [], ...o });
const ids = (a: ReturnType<typeof analyze>) => a.findings.map((f) => f.id);

test("text features read what is in a post", () => {
  const f = textFeatures("5 things we learned\n\n- one\n- two\n- three\n\nWhat would you add?\nhttps://example.com #a #b #c #d");
  assert.equal(f.numberInHook, true);
  assert.equal(f.hasList, true);
  assert.equal(f.hasLink, true);
  assert.equal(f.hashtags, 4);
  assert.equal(f.hasQuestion, true);
  assert.equal(textFeatures("Excited to announce our launch").cliche, true);
  assert.equal(textFeatures("Comment YES if you agree").bait, true);
  assert.equal(textFeatures("Plain statement.").hasQuestion, false);
});

test("no data at all gives the two missing data findings and no scores", () => {
  const a = analyze(base());
  assert.ok(ids(a).includes("LI_NO_DATA") && ids(a).includes("X_NO_DATA"));
  assert.equal(a.scores.linkedin, null);
  assert.equal(a.scores.x, null);
  assert.ok(a.focus.length >= 1);
});

test("falling LinkedIn reach is the top problem and lowers the score", () => {
  const falling = daily(120, (b) => (b < 28 ? 500 : 1000));
  const a = analyze(base({ linkedinDaily: falling }));
  const f = a.findings.find((x) => x.id === "LI_REACH_DOWN")!;
  assert.equal(f.severity, "high");
  assert.equal(f.group, "holding_back");
  assert.match(f.title, /fell 50%/);
  assert.ok(a.scores.linkedin!.overall < 60);
  assert.match(a.headline, /down 50%/);
});

test("growing reach is reported as working, and scores higher", () => {
  const up = analyze(base({ linkedinDaily: daily(120, (b) => (b < 28 ? 1500 : 1000)) }));
  assert.ok(ids(up).includes("LI_REACH_UP"));
  const down = analyze(base({ linkedinDaily: daily(120, (b) => (b < 28 ? 500 : 1000)) }));
  assert.ok(up.scores.linkedin!.overall > down.scores.linkedin!.overall);
});

test("stale data is flagged with its age", () => {
  const old = daily(120, () => 800).map((d, i) => ({ ...d, day: day(60 + 119 - i) }));
  const a = analyze(base({ linkedinDaily: old }));
  const f = a.findings.find((x) => x.id === "LI_STALE")!;
  assert.match(f.title, /60 days old|61 days old/);
  assert.equal(f.severity, "high");
});

test("a strong weekday is found and named", () => {
  // Tuesdays are three times a normal day
  const rows = daily(200, (b) => (new Date(day(b) + "T00:00:00Z").getUTCDay() === 2 ? 3000 : 1000));
  const a = analyze(base({ linkedinDaily: rows }));
  const f = a.findings.find((x) => x.id === "LI_WEEKDAY")!;
  assert.match(f.title, /Tuesday is our strongest/);
  assert.equal(f.group, "experiment");
});

test("quiet days and hit-driven reach are detected", () => {
  const quiet = analyze(base({ linkedinDaily: daily(120, (b) => (b % 3 === 0 ? 1200 : 150)) }));
  assert.ok(ids(quiet).includes("LI_DEAD_DAYS"));
  const spiky = analyze(base({ linkedinDaily: daily(200, (b) => (b % 20 === 0 ? 20000 : 300)) }));
  assert.ok(ids(spiky).includes("LI_HIT_DRIVEN"));
});

test("X: falling reach, silent weeks and passive audience", () => {
  const w = weeks([300, 800, 900, 1000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000], () => ({ comments: 1 }));
  const a = analyze(base({ xWeeks: w.map((x, i) => (i === 0 ? { ...x, impressions: 0, likes: 0, comments: 0, shares: 0 } : x)) }));
  assert.ok(ids(a).includes("X_REACH_DOWN"));
  assert.ok(ids(a).includes("X_INACTIVE"));
  const passive = analyze(base({ xWeeks: weeks(Array(12).fill(2000), () => ({ comments: 2, likes: 100, shares: 40 })) }));
  assert.ok(ids(passive).includes("X_LOW_CONVERSATION"));
});

test("an empty queue is flagged only when Postiz answered", () => {
  assert.ok(ids(analyze(base({ linkedinDaily: daily(60, () => 900), xWeeks: weeks(Array(12).fill(500)), scheduled: [] }))).includes("LI_EMPTY_QUEUE"));
  assert.ok(!ids(analyze(base({ linkedinDaily: daily(60, () => 900), xWeeks: weeks(Array(12).fill(500)), scheduled: null }))).includes("LI_EMPTY_QUEUE"));
  const some = analyze(base({ scheduled: [{ platform: "x", date: "2026-10-06T09:00:00Z", text: "x" }] }));
  assert.ok(!ids(some).includes("X_EMPTY_QUEUE"));
});

function trainingPosts(): PostFact[] {
  const out: PostFact[] = [];
  for (let i = 0; i < 24; i++) {
    const q = i % 2 === 0; // half ask a question, and those do much better
    const link = i % 3 === 0; // a third have a link, and those do worse
    const imp = 1000 * (q ? 1.8 : 1) * (link ? 0.5 : 1);
    const eng = Math.round(imp * (q ? 0.07 : 0.03));
    out.push(post(`x${i}`, "x", `Post number ${i} about shipping${q ? ". What do you think?" : "."}${link ? " https://example.com/p" : ""}`, Math.round(imp), eng, i + 1));
  }
  return out;
}

test("traits that go with better or worse results are found from our own posts", () => {
  const a = analyze(base({ posts: trainingPosts(), xWeeks: weeks(Array(12).fill(1000)) }));
  const q = a.findings.find((x) => x.id === "TRAIT_x_question")!;
  assert.equal(q.group, "working");
  assert.match(q.title, /X posts that ask a question get \d+% higher/);
  const link = a.findings.find((x) => x.id === "TRAIT_x_link")!;
  assert.equal(link.group, "stop");
  assert.match(link.title, /contain a link get \d+% lower/);
  assert.ok(link.evidence.length >= 3);
});

test("lift analysis refuses to speak without enough posts on both sides", () => {
  const few = trainingPosts().slice(0, 5);
  const ctx = buildContext(base({ posts: few }));
  assert.equal(liftTable(ctx.text.x, "x").length, 0);
  const a = analyze(base({ posts: few }));
  assert.ok(!ids(a).some((i) => i.startsWith("TRAIT_")));
});

test("the post audit flags problems and good habits, and scores against our other posts", () => {
  const posts = [
    post("a", "linkedin", "Excited to announce our new thing #a #b #c #d #e #f", 2000, 40, 2),
    post("b", "linkedin", "We cut churn by 30%.\n\nHere is how.\n\n- one\n- two\n- three\n\nWhich would you try first?", 2000, 200, 4),
    post("c", "linkedin", "", 1500, 30, 6, "import"),
    ...Array.from({ length: 10 }, (_, i) => post(`f${i}`, "linkedin", `Filler ${i}. Thoughts?`, 1000 + i * 50, 30 + i, 10 + i)),
  ];
  const audits = analyze(base({ posts })).audits;
  const get = (id: string) => audits.find((x) => x.id === id)!;
  const keys = (id: string) => get(id).flags.map((f) => f.key);
  assert.ok(keys("a").includes("cliche") && keys("a").includes("hashtags") && keys("a").includes("noask"));
  assert.ok(keys("b").includes("endq") && keys("b").includes("number") && keys("b").includes("list"));
  assert.ok(keys("c").includes("notext"));
  assert.ok(get("b").score! > get("a").score!);
  assert.equal(get("a").snippet.startsWith("Excited"), true);
});

test("a LinkedIn account without post text is told why, and how to fix it", () => {
  const posts = Array.from({ length: 12 }, (_, i) => post(`n${i}`, "linkedin", "", 1000, 40, i + 1, "import"));
  const a = analyze(base({ posts }));
  const f = a.findings.find((x) => x.id === "LI_NO_TEXT")!;
  assert.match(f.action, /Compose/);
});

test("findings are sorted by severity and carry plain, complete text", () => {
  const a = analyze(base({ linkedinDaily: daily(120, (b) => (b < 28 ? 400 : 1000)), xWeeks: weeks(Array(12).fill(1000)), posts: trainingPosts() }));
  const order = { high: 0, medium: 1, low: 2 } as const;
  for (let i = 1; i < a.findings.length; i++) assert.ok(order[a.findings[i - 1].severity] <= order[a.findings[i].severity]);
  for (const f of a.findings) {
    assert.ok(f.title && f.why && f.action, f.id);
    assert.equal(new Set(a.findings.map((x) => x.id)).size, a.findings.length);
  }
  assert.ok(a.focus.length > 0 && a.focus.length <= 3);
});

test("today's focus nudges us on our best weekday", () => {
  // 2026-10-05 is a Monday, make Mondays the best day
  const rows = daily(200, (b) => (new Date(day(b) + "T00:00:00Z").getUTCDay() === 1 ? 3000 : 1000));
  const a = analyze(base({ linkedinDaily: rows }));
  assert.match(a.focus[0].title, /strongest LinkedIn day/);
});

test("scores stay between 0 and 100", () => {
  const a = analyze(base({ linkedinDaily: daily(120, (b) => (b < 28 ? 1 : 100000)), xWeeks: weeks([0, 0, 0, 0, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6]) }));
  for (const s of [a.scores.linkedin!, a.scores.x!]) {
    assert.ok(s.overall >= 0 && s.overall <= 100);
    for (const p of s.parts) assert.ok(p.score >= 0 && p.score <= 100);
  }
});

test("nothing we write contains em dashes, asterisks or the word you", () => {
  const a = analyze(base({ linkedinDaily: daily(200, (b) => (b % 3 === 0 ? 1200 : 150)), xWeeks: weeks(Array(12).fill(1000), () => ({ comments: 1 })), posts: trainingPosts(), scheduled: [] }));
  // the quoted bait phrases (like if you agree) are examples of what not to write
  const text = JSON.stringify([a.headline, a.focus, a.findings, PLAYBOOK]).replace(/(like|RT) if you agree/g, "");
  assert.ok(!/[—–]/.test(text), "dash found");
  assert.ok(!/\*/.test(text), "asterisk found");
  assert.ok(!/\byou(r|rs)?\b/i.test(text.replace(/"(why|title|action)":"[^"]*"/g, (m) => m)), "second person found");
});

test("the playbook has both lists for both platforms", () => {
  for (const p of ["linkedin", "x"] as const) {
    assert.ok(PLAYBOOK[p].do.length >= 8 && PLAYBOOK[p].dont.length >= 8);
    for (const i of [...PLAYBOOK[p].do, ...PLAYBOOK[p].dont]) assert.ok(i.title && i.why);
  }
});

test("the same idea is reported once, with the proof from our best posts folded in", () => {
  const a = analyze(base({ posts: trainingPosts(), xWeeks: weeks(Array(12).fill(1000)) }));
  const questionish = a.findings.filter((x) => x.platform === "x" && /question/.test(x.title));
  assert.equal(questionish.length, 1, questionish.map((x) => x.title).join(" | "));
  assert.ok(!a.findings.some((x) => x.id.startsWith("BEST_x_question") || x.id === "BEST_x_endsQuestion"));
  assert.ok(questionish[0].evidence.some((e) => /five best posts/.test(e)), "best posts evidence missing");
  // a link finding and the generic link warning never both appear
  assert.ok(!(a.findings.some((x) => x.id === "TRAIT_x_link") && a.findings.some((x) => x.id === "LINKS_x")));
});

test("the headline names the top issue", () => {
  const a = analyze(base({ linkedinDaily: daily(120, (b) => (b < 28 ? 400 : 1000)) }));
  assert.match(a.headline, /Top issue: LinkedIn reach fell 60%/);
});

test("waiting comments produce a finding, answered ones do not", () => {
  const waiting = analyze(base({ comments: [{ platform: "x", open: 4, oldestHours: 80, last30: 6, replied30: 2 }] }));
  const hit = waiting.findings.find((x) => x.id === "COMMENTS_WAITING_X");
  assert.ok(hit);
  assert.equal(hit.severity, "high");
  const fine = analyze(base({ comments: [{ platform: "x", open: 0, oldestHours: null, last30: 6, replied30: 6 }] }));
  assert.ok(!fine.findings.some((x) => x.id.startsWith("COMMENTS_")));
});
