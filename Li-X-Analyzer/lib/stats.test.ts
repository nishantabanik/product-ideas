import { test } from "node:test";
import assert from "node:assert/strict";
import { byWeekday, rate, summarize, type PostRow } from "./stats.ts";

const row = (o: Partial<PostRow>): PostRow => ({
  id: "1", platform: "x", content: "", published_at: new Date("2026-10-05T10:00:00Z"), url: null,
  impressions: null, likes: null, comments: null, shares: null, clicks: null, ...o,
});

test("rate is null without impressions", () => {
  assert.equal(rate(row({ likes: 5 })), null);
  assert.equal(rate(row({ impressions: 0, likes: 5 })), null);
});

test("summarize ignores unmeasured posts in rates", () => {
  const s = summarize([row({ impressions: 100, likes: 5 }), row({ id: "2" })]);
  assert.equal(s.posts, 2);
  assert.equal(s.measured, 1);
  assert.equal(s.rate, 0.05);
});

test("byWeekday buckets by UTC weekday", () => {
  const b = byWeekday([row({ impressions: 100, likes: 10 })]); // Monday
  assert.equal(b[1], 0.1);
  assert.equal(b[0], null);
});
