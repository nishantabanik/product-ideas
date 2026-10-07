import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchedulePayload, resolveBase, summarizeSeries } from "./postiz.ts";

test("schedule payload targets every channel with provider settings", () => {
  const p = buildSchedulePayload({
    content: "hi",
    date: "2026-10-06T09:00:00.000Z",
    channels: [
      { id: "a", identifier: "x" },
      { id: "b", identifier: "linkedin" },
    ],
  });
  assert.equal(p.type, "schedule");
  assert.equal(p.posts.length, 2);
  assert.equal(p.posts[0].settings.__type, "x");
  assert.equal(p.posts[1].settings.__type, "linkedin");
  assert.equal(p.posts[1].value[0].content, "hi");
});

test("summarizeSeries takes the latest point per metric", () => {
  const s = summarizeSeries([
    { label: "Impressions", data: [{ total: "10", date: "1" }, { total: "25", date: "2" }] },
    { label: "Likes", data: [{ total: 3, date: "2" }] },
    { label: "Retweets", data: [{ total: 1, date: "2" }] },
    { label: "Quotes", data: [{ total: 2, date: "2" }] },
    { label: "Bookmarks", data: [{ total: 9, date: "2" }] },
  ]);
  assert.deepEqual(s, { impressions: 25, likes: 3, shares: 3, bookmarks: 9 });
});

test("summarizeSeries tolerates the missing marker", () => {
  assert.deepEqual(summarizeSeries({ missing: true }), {});
});

test("dashboard URL maps to the cloud API, other URLs are kept", () => {
  assert.equal(resolveBase("https://platform.postiz.com/"), "https://api.postiz.com/public/v1");
  assert.equal(resolveBase(undefined), "https://api.postiz.com/public/v1");
  assert.equal(resolveBase("https://my.host/api/public/v1/"), "https://my.host/api/public/v1");
});

test("summarizeSeries understands the labels Postiz uses for X account totals", () => {
  const s = summarizeSeries(["IMPRESSION", "BOOKMARK", "LIKE", "QUOTE", "REPLY", "RETWEET"].map((label, i) => ({
    label, data: [{ total: "0", date: "a" }, { total: String(10 * (i + 1)), date: "b" }],
  })));
  assert.deepEqual(s, { impressions: 10, bookmarks: 20, likes: 30, shares: 40 + 60, comments: 50 });
});
