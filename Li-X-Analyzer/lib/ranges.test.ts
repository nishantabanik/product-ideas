import { test } from "node:test";
import assert from "node:assert/strict";
import { autoUnit, bucketGrid, bucketStart, daysBetween, has, resolveRange, sum, toSeries } from "./ranges.ts";

const TODAY = "2026-10-05";
const data = { min: "2025-04-04", max: "2026-10-04" };

test("presets end at the latest data day and have the right length", () => {
  const r = resolveRange({ range: "30d" }, TODAY, data);
  assert.equal(r.to, "2026-10-04");
  assert.equal(r.days, 30);
  assert.equal(resolveRange({ range: "7d" }, TODAY, data).days, 7);
  assert.equal(resolveRange({ range: "1y" }, TODAY, data).from, "2025-10-05");
  assert.equal(resolveRange({ range: "2y" }, TODAY, data).from, "2024-10-05");
  assert.equal(resolveRange({ range: "3y" }, TODAY, data).from, "2023-10-05");
});

test("all covers every day we have", () => {
  const r = resolveRange({ range: "all" }, TODAY, data);
  assert.deepEqual([r.from, r.to, r.days], ["2025-04-04", "2026-10-04", 549]);
});

test("no data falls back to today, and an unknown preset to 30 days", () => {
  const r = resolveRange({ range: "weird" }, TODAY, { min: null, max: null });
  assert.deepEqual([r.to, r.days, r.preset], [TODAY, 30, "30d"]);
});

test("custom dates are respected and the previous period is the same length right before", () => {
  const r = resolveRange({ from: "2025-01-01", to: "2025-03-31" }, TODAY, data);
  assert.equal(r.preset, "custom");
  assert.equal(r.days, 90);
  assert.equal(r.prevTo, "2024-12-31");
  assert.equal(daysBetween(r.prevFrom, r.prevTo), 90);
});

test("backwards or invalid custom dates are ignored", () => {
  assert.equal(resolveRange({ from: "2025-03-01", to: "2025-01-01" }, TODAY, data).preset, "30d");
  assert.equal(resolveRange({ from: "2025-02-30", to: "2025-03-01" }, TODAY, data).preset, "30d");
});

test("granularity follows the length, unless chosen", () => {
  assert.equal(autoUnit(30), "day");
  assert.equal(autoUnit(180), "week");
  assert.equal(autoUnit(800), "month");
  assert.equal(resolveRange({ range: "1y", g: "day" }, TODAY, data).unit, "day");
});

test("very long custom ranges are capped at about ten years", () => {
  assert.ok(resolveRange({ from: "1990-01-01", to: "2026-01-01" }, TODAY, data).days <= 3660);
});

test("buckets start on Monday and on the first of the month", () => {
  assert.equal(bucketStart("2026-10-07", "week"), "2026-10-05");
  assert.equal(bucketStart("2026-10-11", "week"), "2026-10-05");
  assert.equal(bucketStart("2026-10-17", "month"), "2026-10-01");
  assert.deepEqual(bucketGrid("2026-10-07", "2026-10-20", "week"), ["2026-10-05", "2026-10-12", "2026-10-19"]);
  assert.deepEqual(bucketGrid("2026-08-15", "2026-10-02", "month"), ["2026-08-01", "2026-09-01", "2026-10-01"]);
});

test("the series covers the whole range and marks missing buckets as null", () => {
  const s = toSeries([{ start: "2026-10-01", impressions: 10, engagements: 1, days: 1 }], "2026-10-01", "2026-10-03", "day");
  assert.deepEqual(s.map((p) => p.impressions), [10, null, null]);
  assert.ok(s.every((p) => !p.partial));
});

test("last N years, months or days", () => {
  assert.equal(resolveRange({ n: "5", u: "y" }, TODAY, data).from, "2021-10-05");
  assert.equal(resolveRange({ n: "18", u: "m" }, TODAY, data).from, "2025-04-05");
  assert.equal(resolveRange({ n: "45", u: "d" }, TODAY, data).days, 45);
  assert.equal(resolveRange({ n: "0", u: "y" }, TODAY, data).preset, "30d");
  assert.equal(resolveRange({ n: "5", u: "q" }, TODAY, data).preset, "30d");
});

test("the cut off first and last periods are flagged partial, full ones are not", () => {
  const full = (start: string, days: number) => ({ start, impressions: 100, engagements: 5, days });
  const m = toSeries([full("2026-08-01", 31), full("2026-09-01", 30), full("2026-10-01", 4)], "2026-08-01", "2026-10-04", "month");
  assert.deepEqual(m.map((p) => p.partial), [false, false, true]);
  const w = toSeries([full("2026-09-28", 3), full("2026-10-05", 7)], "2026-09-30", "2026-10-11", "week");
  assert.deepEqual(w.map((p) => p.partial), [true, false]);
});

test("a bucket with missing days is partial even when the range covers it", () => {
  const m = toSeries([{ start: "2026-09-01", impressions: 10, engagements: 1, days: 20 }], "2026-09-01", "2026-09-30", "month");
  assert.equal(m[0].partial, true);
});

test("likes and comments flow through, and an empty column stays null", () => {
  const rows = [{ start: "2026-10-01", impressions: 10, engagements: 3, days: 1, likes: 2, comments: 1, shares: null }];
  const s = toSeries(rows, "2026-10-01", "2026-10-02", "day");
  assert.deepEqual([s[0].likes, s[0].comments, s[0].shares], [2, 1, null]);
  assert.deepEqual([s[1].likes, s[1].impressions], [null, null]);
  assert.equal(has(s, "likes"), true);
  assert.equal(has(s, "shares"), false);
  assert.equal(sum(s, "comments"), 1);
});
