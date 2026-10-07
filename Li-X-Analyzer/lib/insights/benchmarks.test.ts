import assert from "node:assert/strict";
import { test } from "node:test";
import { benchmark, headline, ordinal, records, type Point, type Series } from "./benchmarks.ts";

const DAY = 86_400_000;
const day = (from: string, i: number) => new Date(Date.parse(`${from}T00:00:00Z`) + i * DAY).toISOString().slice(0, 10);
const make = (from: string, n: number, f: (i: number) => number, skip: (i: number) => boolean = () => false): Series => ({
  unit: "day",
  points: Array.from({ length: n }, (_, i) => i).filter((i) => !skip(i)).map((i) => ({ day: day(from, i), impressions: f(i), engagements: Math.round(f(i) / 10) })),
});
const TODAY = "2026-10-05";

test("last full day is yesterday and previous window is compared", () => {
  // 120 days ending 2026-10-04 (yesterday): last 30 days at 200 a day, the 30 before at 100.
  const from = day(TODAY, -120);
  const s = make(from, 120, (i) => (i >= 90 ? 200 : i >= 60 ? 100 : 150));
  const b = benchmark(s, TODAY);
  assert.equal(b.end, "2026-10-04");
  assert.equal(b.start, "2026-09-05");
  assert.equal(b.metrics.impressions.latest, 6000);
  const prev = b.metrics.impressions.comparisons[0];
  assert.equal(prev.value, 3000);
  assert.equal(prev.deltaPct, 100);
  assert.equal(b.metrics.impressions.comparisons[1].value, null);
  assert.match(b.metrics.impressions.comparisons[1].note!, /year ago/);
});

test("today's partial day is excluded", () => {
  const s = make(day(TODAY, -60), 61, () => 10); // includes today
  const b = benchmark(s, TODAY);
  assert.equal(b.end, "2026-10-04");
});

test("year ago comparison when we have it", () => {
  const s = make(day(TODAY, -500), 500, (i) => (i < 200 ? 50 : 100));
  const b = benchmark(s, TODAY);
  const ya = b.metrics.impressions.comparisons[1];
  assert.equal(ya.value, 1500); // 365 days before the end, still in the 50 a day era
  assert.equal(ya.deltaPct, 100);
});

test("usual needs 90 days, otherwise says so", () => {
  const b = benchmark(make(day(TODAY, -60), 59, () => 10), TODAY);
  const usual = b.metrics.impressions.comparisons[2];
  assert.equal(usual.value, null);
  assert.match(usual.note!, /90\+ days/);
  assert.ok(b.notes.some((n) => /90/.test(n)));
});

test("usual is the median of rolling windows, best is the max, rank among blocks", () => {
  // 150 days: block pattern of 30 days each: 100,300,200,500,400 per day (oldest to newest), so latest block = 400/day
  const levels = [100, 300, 200, 500, 400];
  const s = make(day(TODAY, -151), 150, (i) => levels[Math.floor(i / 30)]);
  const b = benchmark(s, TODAY);
  const m = b.metrics.impressions;
  assert.equal(m.latest, 12000);
  assert.deepEqual(m.rank, { rank: 2, of: 5 });
  assert.equal(m.comparisons[3].value, 15000);
  assert.ok(m.comparisons[2].value !== null);
  assert.ok(m.comparisons[2].value! >= 3000 && m.comparisons[2].value! <= 15000);
  assert.match(headline(b), /^Last 30 days: 12,000 impressions, \d+% (above|below) our usual 30 days, 2nd best of 5 periods of 30 days\.$/);
});

test("gaps: small gaps are scaled, big gaps make a window unusable", () => {
  const small = benchmark(make(day(TODAY, -61), 60, () => 10, (i) => i === 40 || i === 41), TODAY); // 2 missing in 30, still >= 90 percent
  assert.equal(small.metrics.impressions.latest, 300);
  const big = benchmark(make(day(TODAY, -61), 60, () => 10, (i) => i >= 35 && i < 50), TODAY);
  assert.equal(big.metrics.impressions.latest, null);
  assert.match(headline(big), /cannot compare/);
});

test("all zeros never divide by zero", () => {
  const b = benchmark(make(day(TODAY, -200), 199, () => 0), TODAY);
  const m = b.metrics.impressions;
  assert.equal(m.latest, 0);
  for (const c of m.comparisons) assert.equal(c.deltaPct, null);
  assert.deepEqual(m.rank, { rank: 1, of: 6 });
  assert.ok(b.notes.some((n) => /no impressions/.test(n)));
  assert.doesNotMatch(headline(b), /NaN|Infinity/);
});

test("no data at all", () => {
  const b = benchmark({ unit: "day", points: [] }, TODAY);
  assert.equal(b.metrics.impressions.latest, null);
  assert.equal(headline(b), "We have no numbers to compare yet.");
});

test("stale data is flagged and anchors on the newest data", () => {
  const b = benchmark(make(day(TODAY, -100), 60, () => 10), TODAY); // ends 41 days ago
  assert.equal(b.end, day(TODAY, -41));
  assert.ok(b.notes.some((n) => /days ago/.test(n)));
});

test("weekly series uses 4-week windows and says so", () => {
  const weeks: Point[] = Array.from({ length: 12 }, (_, i) => ({ day: day("2026-07-13", i * 7), impressions: i < 8 ? 100 : 300, engagements: 5 }));
  const b = benchmark({ unit: "week", points: weeks }, TODAY);
  assert.equal(b.windowName, "4 weeks");
  assert.equal(b.metrics.impressions.latest, 1200);
  assert.equal(b.metrics.impressions.comparisons[0].value, 400);
  assert.equal(b.metrics.impressions.comparisons[2].value, null); // 84 days < 90
  assert.deepEqual(b.metrics.impressions.rank, { rank: 1, of: 3 });
  assert.ok(b.notes.some((n) => /weekly/.test(n)));
});

test("records: best day, week, month and posts", () => {
  const pts: Point[] = [
    { day: "2026-01-05", impressions: 100, engagements: 1 }, { day: "2026-01-06", impressions: 900, engagements: 1 },
    { day: "2026-02-10", impressions: 500, engagements: 1 }, { day: "2026-02-11", impressions: 500, engagements: 1 },
  ];
  const posts = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, impressions: 100 + i * 10, publishedAt: `2026-0${(i % 9) + 1}-15T10:00:00Z` }));
  posts.push({ id: "latest", impressions: 150, publishedAt: "2026-09-30T10:00:00Z" });
  const r = records({ unit: "day", points: pts }, posts, TODAY);
  assert.deepEqual(r.bestDay, { day: "2026-01-06", value: 900 });
  assert.equal(r.bestWeek!.value, 1000);
  assert.equal(r.bestWeek!.start, "2026-01-05");
  assert.deepEqual(r.bestMonth, { month: "2026-01", value: 1000 });
  assert.equal(r.bestPost!.id, "p11");
  assert.equal(r.latestPost!.id, "latest");
  assert.equal(r.latestPost!.of, 13);
  assert.equal(r.latestPost!.percentile, (5 / 12) * 100); // 100..150 are below 150 strictly: i=0..4
});

test("records: thin posts, zeros, weekly", () => {
  const r = records({ unit: "day", points: [{ day: "2026-01-01", impressions: 0, engagements: 0 }] }, [{ id: "a", impressions: 0, publishedAt: "2026-01-01T00:00:00Z" }, { id: "b", impressions: null, publishedAt: null }], TODAY);
  assert.equal(r.bestDay, null);
  assert.equal(r.bestPost, null);
  assert.equal(r.latestPost, null);
  const few = records({ unit: "day", points: [] }, [{ id: "a", impressions: 5, publishedAt: "2026-01-01T00:00:00Z" }, { id: "b", impressions: 9, publishedAt: "2026-01-02T00:00:00Z" }], TODAY);
  assert.equal(few.latestPost!.percentile, null);
  assert.ok(few.notes.some((n) => /10/.test(n)));
  const wk = records({ unit: "week", points: [{ day: "2026-09-07", impressions: 50, engagements: 1 }] }, [], TODAY);
  assert.equal(wk.bestDay, null);
  assert.equal(wk.bestMonth, null);
  assert.equal(wk.bestWeek!.value, 50);
});

test("ordinals", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
});
