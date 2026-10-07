import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { inferOrder, parseCsv, parseDay, parseWorkbook, type Sheet } from "./import-parse.ts";

const URL_A = "https://www.linkedin.com/feed/update/urn:li:activity:111/";
const URL_B = "https://www.linkedin.com/feed/update/urn:li:activity:222/";

const engagement: Sheet = {
  name: "ENGAGEMENT",
  rows: [["Date", "Impressions", "Engagements"], ["9/30/2025", 120, 5], ["10/1/2025", "1,300", 40], ["10/2/2025", 0, 0]],
};
const topPosts: Sheet = {
  name: "TOP POSTS",
  rows: [
    ["Maximum of 50 posts can be displayed"],
    ["Post URL", "Post publish date", "Engagements", "", "Post URL", "Post publish date", "Impressions"],
    [URL_A, "9/1/2025", 30, "", URL_B, "9/2/2025", 500],
    [URL_B, "9/2/2025", 12, "", URL_A, "9/1/2025", 900],
  ],
};

test("daily sheet gives one row per day, with numbers and zeros", () => {
  const r = parseWorkbook([engagement]);
  assert.deepEqual(r.daily.map((d) => [d.day, d.impressions, d.engagements]), [
    ["2025-09-30", 120, 5], ["2025-10-01", 1300, 40], ["2025-10-02", 0, 0],
  ]);
  assert.equal(r.daily[0].platform, "linkedin");
});

test("two side by side top post tables are merged by post, not mixed up", () => {
  const { posts } = parseWorkbook([topPosts]);
  assert.equal(posts.length, 2);
  const a = posts.find((p) => p.url === URL_A)!, b = posts.find((p) => p.url === URL_B)!;
  assert.equal(a.engagements, 30); assert.equal(a.impressions, 900);
  assert.equal(b.engagements, 12); assert.equal(b.impressions, 500);
  assert.equal(a.publishedAt, "2025-09-01T12:00:00.000Z");
});

test("a post only present in one table keeps the other value empty", () => {
  const { posts } = parseWorkbook([{ name: "t", rows: [
    ["Post URL", "Post publish date", "Engagements", "Post URL", "Post publish date", "Impressions"],
    [URL_A, "9/1/2025", 30, URL_B, "9/2/2025", 500],
  ] }]);
  assert.equal(posts.find((p) => p.url === URL_A)!.impressions, null);
  assert.equal(posts.find((p) => p.url === URL_B)!.engagements, null);
});

test("ids keep the same scheme as before, so earlier imports are matched, not duplicated", () => {
  const [p] = parseWorkbook([{ name: "t", rows: [["Post URL", "Impressions"], [URL_A, "5"]] }]).posts;
  assert.equal(p.id, "li_" + createHash("sha1").update(URL_A).digest("hex").slice(0, 20));
});

test("whole export: daily plus posts, and the 50 post note appears at 50 rows", () => {
  const rows: unknown[][] = [["Post URL", "Post publish date", "Impressions"]];
  for (let i = 0; i < 50; i++) rows.push([`https://www.linkedin.com/feed/update/urn:li:activity:${i}/`, "9/1/2025", i]);
  const r = parseWorkbook([engagement, { name: "TOP", rows }]);
  assert.equal(r.posts.length, 50);
  assert.equal(r.daily.length, 3);
  assert.ok(r.notes.some((n) => /at most 50 posts/.test(n)));
});

test("date order is inferred: month first by default, day first when a value proves it", () => {
  assert.equal(inferOrder(["9/30/2025", "1/2/2025"]), "mdy");
  assert.equal(inferOrder(["30/9/2025", "1/2/2025"]), "dmy");
  assert.equal(inferOrder(["1/2/2025"]), "mdy");
  assert.equal(parseDay("1/2/2025", "mdy"), "2025-01-02");
  assert.equal(parseDay("1/2/2025", "dmy"), "2025-02-01");
  assert.equal(parseDay("2025-10-05"), "2025-10-05");
  assert.equal(parseDay(new Date(Date.UTC(2025, 9, 5))), "2025-10-05");
  assert.equal(parseDay("Sep 30, 2025"), "2025-09-30");
  assert.equal(parseDay("2/30/2025"), null);
  assert.equal(parseDay("hello"), null);
});

test("day first files are read day first", () => {
  const r = parseWorkbook([{ name: "E", rows: [["Date", "Impressions"], ["13/10/2025", 5], ["2/3/2025", 7]] }]);
  assert.deepEqual(r.daily.map((d) => d.day), ["2025-10-13", "2025-03-02"]);
});

test("X analytics export is recognised and keyed by tweet id", () => {
  const { posts } = parseWorkbook([{ name: "x", rows: [
    ["Tweet id", "Tweet permalink", "Tweet text", "time", "impressions", "engagements", "retweets", "replies", "likes", "url clicks"],
    ["111", "https://twitter.com/me/status/111", "hello", "2026-10-01 14:32 +0000", "1,000", "50", "4", "3", "30", "7"],
  ] }]);
  const p = posts[0];
  assert.equal(p.platform, "x"); assert.equal(p.id, "x_111");
  assert.equal(p.impressions, 1000); assert.equal(p.engagements, 50); assert.equal(p.comments, 3);
  assert.equal(p.shares, 4); assert.equal(p.clicks, 7);
  assert.equal(p.publishedAt, "2026-10-01T14:32:00.000Z");
});

test("nothing recognisable gives nothing", () => {
  const r = parseWorkbook([{ name: "PERFORMANCE", rows: [["Overall", "x"], ["a", "b"]] }]);
  assert.deepEqual([r.daily.length, r.posts.length], [0, 0]);
});

test("csv handles quotes and commas", () => {
  assert.deepEqual(parseCsv('a,"b,c"\n1,"say ""hi"""'), [["a", "b,c"], ["1", 'say "hi"']]);
});

test("a daily table with reactions, comments and reposts keeps them", () => {
  const r = parseWorkbook([{ name: "Metrics", rows: [
    ["Date", "Impressions (total)", "Reactions (total)", "Comments (total)", "Reposts (total)", "Clicks (total)"],
    ["10/1/2025", 1200, 40, 6, 3, 21],
    ["10/2/2025", 0, 0, 0, 0, 0],
  ] }]);
  assert.equal(r.daily.length, 2);
  assert.deepEqual([r.daily[0].impressions, r.daily[0].likes, r.daily[0].comments, r.daily[0].shares, r.daily[0].clicks], [1200, 40, 6, 3, 21]);
  assert.deepEqual([r.daily[1].likes, r.daily[1].comments], [0, 0]);
});

test("a personal export without those columns leaves them empty, not zero", () => {
  const r = parseWorkbook([{ name: "ENGAGEMENT", rows: [["Date", "Impressions", "Engagements"], ["10/1/2025", 100, 5]] }]);
  assert.deepEqual([r.daily[0].likes, r.daily[0].comments, r.daily[0].shares], [null, null, null]);
});
