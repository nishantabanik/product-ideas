import { test } from "node:test";
import assert from "node:assert/strict";
import { sumTotals, totalsFromSeries, weeklyBuckets, ZERO, type Totals } from "./xaccount.ts";

const t = (impressions: number, likes = 0): Totals => ({ ...ZERO, impressions, likes });

test("weekly buckets are the differences of the running totals", () => {
  const b = weeklyBuckets([t(100, 5), t(250, 9), t(250, 9), t(300, 20)])!;
  assert.deepEqual(b.map((x) => x.impressions), [100, 150, 0, 50]);
  assert.deepEqual(b.map((x) => x.likes), [5, 4, 0, 11]);
});

test("a shrinking running total means a failed call, so we refuse it", () => {
  assert.equal(weeklyBuckets([t(100), t(0), t(300)]), null);
});

test("all zero is a valid account with no posts", () => {
  assert.deepEqual(weeklyBuckets([t(0), t(0)])!.map((x) => x.impressions), [0, 0]);
});

test("totals come out of the Postiz series", () => {
  const x = totalsFromSeries([
    { label: "IMPRESSION", data: [{ total: "0", date: "a" }, { total: "42", date: "b" }] },
    { label: "RETWEET", data: [{ total: "0", date: "a" }, { total: "3", date: "b" }] },
    { label: "QUOTE", data: [{ total: "0", date: "a" }, { total: "1", date: "b" }] },
  ]);
  assert.equal(x.impressions, 42);
  assert.equal(x.shares, 4);
  assert.deepEqual(totalsFromSeries([]), ZERO);
});

test("sumTotals adds every field", () => {
  assert.equal(sumTotals([t(1, 2), t(3, 4)]).impressions, 4);
  assert.equal(sumTotals([t(1, 2), t(3, 4)]).likes, 6);
});
