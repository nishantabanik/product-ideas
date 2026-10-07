import test from "node:test";
import assert from "node:assert/strict";
import { daysSince, doneToday, parseTargets, pickToday, profileLink, streak, weeklyTotals, weekTotal, type TargetFact } from "./rotation.ts";
import { COMMENT_PROMPTS } from "./prompts.ts";

const now = new Date("2026-07-15T10:00:00Z"); // Wednesday
const T = (id: string, last: string | null = null, active = true): TargetFact => ({ id, active, lastEngagedAt: last });

test("pickToday empty and inactive", () => {
  assert.deepEqual(pickToday([], [], now), []);
  assert.deepEqual(pickToday([T("a", null, false)], [], now), []);
  assert.deepEqual(pickToday([T("a")], [], now, 0), []);
});

test("pickToday never engaged first, then least recent, stable ties", () => {
  const ts = [T("a", "2026-07-10T00:00:00Z"), T("b"), T("c", "2026-07-01T00:00:00Z"), T("d"), T("e", "2026-07-10T00:00:00Z")];
  assert.deepEqual(pickToday(ts, [], now, 10).map((t) => t.id), ["b", "d", "c", "a", "e"]);
  assert.deepEqual(pickToday(ts, [], now, 2).map((t) => t.id), ["b", "d"]);
});

test("pickToday skips engaged today and uses the daily quota", () => {
  const ts = [T("a"), T("b"), T("c"), T("d")];
  const log = [{ day: "2026-07-15", targetId: "a" }, { day: "2026-07-14", targetId: "b" }];
  assert.deepEqual(pickToday(ts, log, now, 3).map((t) => t.id), ["b", "c"]);
  assert.equal(doneToday(log, now), 1);
  assert.deepEqual(pickToday(ts, ts.map((t) => ({ day: "2026-07-15", targetId: t.id })), now), []);
});

test("pickToday uses the UTC day near midnight", () => {
  const late = new Date("2026-07-15T23:59:59Z");
  assert.deepEqual(pickToday([T("a")], [{ day: "2026-07-15", targetId: "a" }], late), []);
  const next = new Date("2026-07-16T00:00:00Z");
  assert.deepEqual(pickToday([T("a")], [{ day: "2026-07-15", targetId: "a" }], next).map((t) => t.id), ["a"]);
});

test("streak", () => {
  assert.equal(streak([], now), 0);
  assert.equal(streak(["2026-07-15"], now), 1);
  assert.equal(streak(["2026-07-14", "2026-07-13"], now), 2); // today not yet done
  assert.equal(streak(["2026-07-13"], now), 0); // gap yesterday
  assert.equal(streak(["2026-07-15", "2026-07-14", "2026-07-12"], now), 2);
  assert.equal(streak(["2026-07-15", "2026-07-15", "2026-07-14"], now, 2), 1); // today has 2, yesterday has 1
  assert.equal(streak(["2026-07-15", "garbage"], now), 1);
});

test("streak across month and year ends", () => {
  assert.equal(streak(["2026-03-01", "2026-02-28", "2026-02-27"], new Date("2026-03-01T05:00:00Z")), 3);
  assert.equal(streak(["2024-03-01", "2024-02-29", "2024-02-28"], new Date("2024-03-01T05:00:00Z")), 3);
  assert.equal(streak(["2026-01-01", "2025-12-31", "2025-12-30"], new Date("2026-01-01T00:00:00Z")), 3);
});

test("week totals", () => {
  const days = ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-12", "2026-07-06", "2026-07-16"];
  assert.equal(weekTotal(days, now), 3);
  assert.equal(weekTotal([], now), 0);
  assert.deepEqual(weeklyTotals(days, now, 2), [{ weekStart: "2026-07-06", count: 2 }, { weekStart: "2026-07-13", count: 3 }]);
  assert.equal(weekTotal(["2026-07-13"], new Date("2026-07-19T12:00:00Z")), 1); // Sunday still in the week
  assert.equal(weekTotal(["2026-07-13"], new Date("2026-07-20T00:00:00Z")), 0);
});

test("daysSince", () => {
  assert.equal(daysSince(null, now), null);
  assert.equal(daysSince("2026-07-15T00:00:00Z", now), 0);
  assert.equal(daysSince("2026-07-12T11:00:00Z", now), 2);
  assert.equal(daysSince("nope", now), null);
});

test("parse and links", () => {
  assert.deepEqual(parseTargets("Ann, @ann\nann, ann\nBob"), [{ name: "Ann", handle: "ann" }, { name: "Bob", handle: null }]);
  assert.equal(parseTargets("a\nb\nc", 2).length, 2);
  assert.equal(profileLink({ platform: "x", handle: "@jane_d", profileUrl: null }), "https://x.com/jane_d");
  assert.equal(profileLink({ platform: "x", handle: "bad handle!", profileUrl: null }), null);
  assert.equal(profileLink({ platform: "linkedin", handle: "jane", profileUrl: null }), null);
  assert.equal(profileLink({ platform: "linkedin", handle: null, profileUrl: "https://linkedin.com/in/j" }), "https://linkedin.com/in/j");
});

test("eight prompts", () => {
  assert.equal(COMMENT_PROMPTS.length, 8);
  assert.equal(new Set(COMMENT_PROMPTS.map((p) => p.id)).size, 8);
  assert.ok(COMMENT_PROMPTS.every((p) => p.title && p.how && p.starter));
});
