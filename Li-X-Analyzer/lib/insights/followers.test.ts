import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzePlatform, bestDay, chartSeries, netSeries, sumNet, type FollowerDay, type PostIn } from "./followers.ts";

const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
const gains = (list: (number | null)[]): FollowerDay[] =>
  list.flatMap((g, i) => (g === null ? [] : [{ day: day(i), total: null, gained: g, lost: 0 }]));
const post = (i: number, id = `p${i}`, hour = 9): PostIn => ({ id, platform: "linkedin", published_at: `${day(i)}T${String(hour).padStart(2, "0")}:00:00Z`, content: `post ${id}` });

test("net series uses gained minus lost and says so", () => {
  const r = netSeries([{ day: "2026-01-01", total: null, gained: 5, lost: 2 }, { day: "2026-01-02", total: null, gained: 1, lost: 4 }]);
  assert.deepEqual(r.days, [{ day: "2026-01-01", net: 3 }, { day: "2026-01-02", net: -3 }]);
  assert.equal(r.basis, "gained-lost");
});

test("net series from totals never spans a missing day", () => {
  const rows: FollowerDay[] = [100, 103, null, 110, 111].map((t, i) => ({ day: day(i), total: t, gained: null, lost: null })).filter((r) => r.total !== null);
  const r = netSeries(rows);
  assert.deepEqual(r.days, [{ day: day(1), net: 3 }, { day: day(4), net: 1 }]);
  assert.equal(r.basis, "totals");
});

test("mixed basis and gain only basis", () => {
  const r = netSeries([
    { day: day(0), total: 50, gained: null, lost: null }, { day: day(1), total: 55, gained: null, lost: null }, { day: day(2), total: null, gained: 2, lost: 1 },
  ]);
  assert.equal(r.basis, "mixed");
  assert.equal(netSeries([{ day: day(0), total: null, gained: 2, lost: null }]).basis, "gained");
  assert.equal(netSeries([]).basis, "none");
});

test("sumNet, bestDay and chartSeries", () => {
  const { days } = netSeries(gains([1, 2, 9, 0]));
  assert.deepEqual(sumNet(days, day(1), day(2)), { sum: 11, days: 2, span: 2 });
  assert.equal(bestDay(days)?.day, day(2));
  assert.equal(bestDay(netSeries(gains([0, 0])).days), null);
  assert.deepEqual(chartSeries(gains([1, 2]), days.slice(0, 2)).points.map((p) => p.y), [1, 3]);
  const t = chartSeries([{ day: day(0), total: 10, gained: null, lost: null }, { day: day(1), total: 12, gained: null, lost: null }], []);
  assert.equal(t.kind, "total");
});

test("too little data lists exactly what is missing", () => {
  const a = analyzePlatform(gains([1, 1, 1, 1, 1]), [post(1), post(2)]);
  assert.equal(a.enough, false);
  assert.equal(a.missing.length, 2);
  assert.match(a.missing[0], /9 more days/);
  assert.match(a.missing[1], /3 more posts/);
  assert.deepEqual(a.ranked, []);
});

test("a spike after one post links to it and not to quiet posts", () => {
  const g: number[] = Array.from({ length: 40 }, (_, i) => (i % 3 === 0 ? 2 : 1));
  g[20] = 30; g[21] = 20;
  const posts = [post(5), post(10), post(15), post(20), post(30), post(35)];
  const a = analyzePlatform(gains(g), posts);
  assert.equal(a.enough, true);
  assert.equal(a.baselineKind, "median");
  assert.equal(a.ranked[0].id, "p20");
  assert.equal(a.ranked[0].linked, true);
  assert.equal(a.ranked.filter((r) => r.linked).length, 1);
  assert.equal(a.postsUsed, 6);
});

test("flat data links nothing", () => {
  const a = analyzePlatform(gains(Array(30).fill(2)), [5, 8, 11, 14, 17, 20].map((i) => post(i)));
  assert.equal(a.enough, true);
  assert.ok(a.ranked.every((r) => !r.linked && r.excess === 0));
});

test("missing days: a post whose window lacks a day is skipped, not guessed", () => {
  const g: (number | null)[] = Array(30).fill(1);
  g[11] = null;
  const a = analyzePlatform(gains(g), [post(3), post(6), post(9), post(10), post(15), post(25)]);
  assert.equal(a.enough, true);
  assert.equal(a.postsSkipped, 1);
  assert.equal(a.postsUsed, 5);
  assert.ok(!a.ranked.some((r) => r.id === "p10"));
  assert.ok(a.ranked.some((r) => r.id === "p25"));
});

test("a post on the very last data day has no full window", () => {
  const a = analyzePlatform(gains(Array(20).fill(1)), [post(2), post(4), post(6), post(8), post(19)]);
  assert.equal(a.postsSkipped, 1);
});

test("overlapping windows are flagged as shared", () => {
  const g = Array(30).fill(1);
  g[10] = 25;
  const a = analyzePlatform(gains(g), [post(10, "a", 8), post(10, "b", 18), post(11, "c"), post(3), post(20), post(25)]);
  const byId = Object.fromEntries(a.ranked.map((r) => [r.id, r]));
  assert.equal(byId.a.sharedWith, 2);
  assert.equal(byId.c.sharedWith, 2);
  assert.equal(byId.p3.sharedWith, 0);
});

test("one huge day does not move the baseline", () => {
  const g = Array(40).fill(1);
  g[30] = 500;
  const a = analyzePlatform(gains(g), [post(2), post(6), post(10), post(14), post(18), post(30)]);
  assert.equal(a.baseline, 2);
  assert.equal(a.ranked[0].id, "p30");
});

test("thin clean windows fall back to the average day times two", () => {
  // a post on almost every day leaves fewer than 5 clean windows
  const g = Array(16).fill(2);
  const posts = Array.from({ length: 14 }, (_, i) => post(i));
  const a = analyzePlatform(gains(g), posts);
  assert.equal(a.baselineKind, "average");
  assert.equal(a.baseline, 4);
});

test("totals only data works the same way", () => {
  const rows: FollowerDay[] = Array.from({ length: 30 }, (_, i) => ({ day: day(i), total: 100 + i + (i >= 21 ? 40 : 0) + (i === 20 ? 20 : 0), gained: null, lost: null }));
  const a = analyzePlatform(rows, [post(2), post(6), post(10), post(14), post(19), post(25)]);
  assert.equal(a.basis, "totals");
  assert.equal(a.ranked[0].id, "p19");
});
