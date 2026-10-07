import assert from "node:assert/strict";
import { test } from "node:test";
import { goalLabel, goalProgress, mergeDaily, periodBounds, spreadWeekly, validateGoal, type DailyRow } from "./goals.ts";

const at = (s: string) => new Date(`${s}T15:00:00Z`);
const rows = (from: string, n: number, v: number): DailyRow[] => Array.from({ length: n }, (_, i) => ({ day: new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10), value: v }));

test("week bounds cross months and years", () => {
  assert.deepEqual(periodBounds("week", "2026-12-31"), { start: "2026-12-28", end: "2027-01-03" }); // Thursday
  assert.deepEqual(periodBounds("week", "2026-03-01"), { start: "2026-02-23", end: "2026-03-01" }); // Sunday
  assert.deepEqual(periodBounds("week", "2026-10-05"), { start: "2026-10-05", end: "2026-10-11" }); // Monday
});

test("month bounds, leap February", () => {
  assert.deepEqual(periodBounds("month", "2028-02-10"), { start: "2028-02-01", end: "2028-02-29" });
  assert.deepEqual(periodBounds("month", "2027-02-10"), { start: "2027-02-01", end: "2027-02-28" });
  assert.deepEqual(periodBounds("month", "2026-12-31"), { start: "2026-12-01", end: "2026-12-31" });
});

test("on track and behind from the pace of this period", () => {
  // Month of 31 days, today the 10th, 100 a day so far: ends near 3,100.
  const r = rows("2026-10-01", 10, 100);
  const on = goalProgress({ metric: "impressions", period: "month", target: 3000 }, r, at("2026-10-10"));
  assert.equal(on.current, 1000);
  assert.equal(on.elapsedDays, 10);
  assert.equal(on.remainingDays, 21);
  assert.equal(on.projected, 3100);
  assert.equal(on.status, "on_track");
  assert.ok(Math.abs(on.requiredPerDay! - 2000 / 21) < 1e-9);
  const behind = goalProgress({ metric: "impressions", period: "month", target: 4000 }, r, at("2026-10-10"));
  assert.equal(behind.status, "behind");
  assert.match(behind.explanation, /^Behind/);
  // 95 percent rule
  const edge = goalProgress({ metric: "impressions", period: "month", target: 3263 }, r, at("2026-10-10"));
  assert.equal(edge.status, "on_track"); // 3100 >= 0.95 * 3263 = 3099.85
  const out = goalProgress({ metric: "impressions", period: "month", target: 3264 }, r, at("2026-10-10"));
  assert.equal(out.status, "behind");
});

test("achieved, even with days left", () => {
  const p = goalProgress({ metric: "posts", period: "week", target: 3 }, rows("2026-10-05", 3, 1), at("2026-10-07"));
  assert.equal(p.status, "achieved");
  assert.equal(p.requiredPerDay, 0);
});

test("zero data is no_data, zero rows in a period are behind", () => {
  const none = goalProgress({ metric: "likes", period: "week", target: 10 }, [], at("2026-10-08"));
  assert.equal(none.status, "no_data");
  assert.equal(none.projected, null);
  const zeros = goalProgress({ metric: "likes", period: "week", target: 10 }, rows("2026-10-05", 4, 0), at("2026-10-08"));
  assert.equal(zeros.status, "behind");
  assert.equal(zeros.projected, 0);
});

test("first two days use the last 14 days and say too early", () => {
  // Monday 2026-10-05. Previous 13 days at 100, today nothing yet recorded.
  const r = rows("2026-09-22", 13, 100);
  const p = goalProgress({ metric: "impressions", period: "week", target: 700 }, r, at("2026-10-05"));
  assert.equal(p.tooEarly, true);
  assert.equal(p.elapsedDays, 1);
  assert.equal(p.remainingDays, 6);
  assert.equal(p.current, 0);
  assert.ok(Math.abs(p.projected! - (1300 / 14) * 6) < 1e-9);
  assert.match(p.explanation, /Too early/);
  const third = goalProgress({ metric: "impressions", period: "week", target: 700 }, r, at("2026-10-07"));
  assert.equal(third.tooEarly, false);
});

test("today is the last day", () => {
  const r = rows("2026-10-05", 7, 100); // Monday to Sunday
  const hit = goalProgress({ metric: "impressions", period: "week", target: 700 }, r, at("2026-10-11"));
  assert.equal(hit.status, "achieved");
  const miss = goalProgress({ metric: "impressions", period: "week", target: 800 }, r, at("2026-10-11"));
  assert.equal(miss.remainingDays, 0);
  assert.equal(miss.projected, 700);
  assert.equal(miss.requiredPerDay, null);
  assert.equal(miss.status, "behind");
});

test("week crossing a year uses both months", () => {
  const r = rows("2026-12-28", 4, 10); // Mon to Thu, today Thursday Dec 31
  const p = goalProgress({ metric: "impressions", period: "week", target: 70 }, r, at("2026-12-31"));
  assert.equal(p.periodEnd, "2027-01-03");
  assert.equal(p.current, 40);
  assert.equal(p.remainingDays, 3);
  assert.equal(p.projected, 70);
});

test("leap February has 29 days", () => {
  const p = goalProgress({ metric: "impressions", period: "month", target: 2900 }, rows("2028-02-01", 5, 100), at("2028-02-05"));
  assert.equal(p.totalDays, 29);
  assert.equal(p.remainingDays, 24);
  assert.equal(p.projected, 2900);
});

test("rows outside the period are ignored for current", () => {
  const p = goalProgress({ metric: "impressions", period: "week", target: 1000 }, [{ day: "2026-10-04", value: 999 }, { day: "2026-10-06", value: 5 }, { day: "2026-10-12", value: 50 }], at("2026-10-07"));
  assert.equal(p.current, 5);
});

test("labels", () => {
  assert.equal(goalLabel({ platform: "linkedin", metric: "impressions", period: "month", target: 100000 }), "100,000 impressions a month on LinkedIn");
  assert.equal(goalLabel({ platform: "both", metric: "posts", period: "week", target: 1 }), "1 post a week on LinkedIn and X");
});

test("validation", () => {
  const ok = { platform: "x", metric: "likes", period: "week", target: "250" };
  assert.equal(validateGoal(ok, 0).ok, true);
  assert.equal(validateGoal(ok, 12).ok, false);
  assert.equal(validateGoal({ ...ok, target: 0 }, 0).ok, false);
  assert.equal(validateGoal({ ...ok, target: -5 }, 0).ok, false);
  assert.equal(validateGoal({ ...ok, target: NaN }, 0).ok, false);
  assert.equal(validateGoal({ ...ok, target: 1e12 }, 0).ok, false);
  assert.equal(validateGoal({ ...ok, platform: "tiktok" }, 0).ok, false);
  assert.equal(validateGoal({ ...ok, metric: "posts", target: 2.5 }, 0).ok, false);
});

test("spread and merge", () => {
  const d = spreadWeekly([{ start: "2026-10-05", value: 70 }]);
  assert.equal(d.length, 7);
  assert.equal(d[6].day, "2026-10-11");
  assert.equal(d[0].value, 10);
  const m = mergeDaily([{ day: "2026-10-05", value: 1 }], [{ day: "2026-10-05", value: 2 }, { day: "2026-10-04", value: 4 }]);
  assert.deepEqual(m, [{ day: "2026-10-04", value: 4 }, { day: "2026-10-05", value: 3 }]);
});
