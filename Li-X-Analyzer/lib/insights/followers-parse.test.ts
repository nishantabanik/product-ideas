import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseWorkbook, type Sheet } from "../import-parse.ts";

test("LinkedIn followers sheet with New followers and Total followers", () => {
  const sheet: Sheet = { name: "FOLLOWERS", rows: [["Date", "New followers"], ["9/30/2025", 4], ["10/1/2025", 7], ["10/2/2025", 0]] };
  const r = parseWorkbook([sheet]);
  assert.deepEqual(r.followers.map((f) => [f.platform, f.day, f.gained, f.total, f.lost]), [
    ["linkedin", "2025-09-30", 4, null, null], ["linkedin", "2025-10-01", 7, null, null], ["linkedin", "2025-10-02", 0, null, null],
  ]);
});

test("Page style sheet: total followers, header lines above, day first dates", () => {
  const sheet: Sheet = {
    name: "Follower metrics",
    rows: [["Total followers on 28/10/2025: 1,250"], ["Date", "Sponsored followers", "Organic followers", "Total followers"], ["27/10/2025", 0, 3, "1,248"], ["28/10/2025", 1, 2, "1,251"]],
  };
  const r = parseWorkbook([sheet]);
  assert.deepEqual(r.followers.map((f) => [f.day, f.gained, f.total]), [["2025-10-27", 3, 1248], ["2025-10-28", 3, 1251]]);
});

test("header names are matched loosely and unreadable dates are skipped", () => {
  const sheet: Sheet = { name: "Followers (all time)", rows: [[" DATE ", " Total Followers "], ["not a date", 5], ["2025-03-01", 900], ["2025-03-02", ""]] };
  const r = parseWorkbook([sheet]);
  assert.deepEqual(r.followers.map((f) => [f.day, f.total]), [["2025-03-01", 900]]);
});

test("X analytics CSV gives gained and lost next to the daily numbers", () => {
  const csv = 'Date,Impressions,Likes,New follows,Unfollows\n"Fri, Oct 3, 2025",1200,30,5,2\n"Sat, Oct 4, 2025",900,20,3,0\n';
  const r = parseWorkbook([{ name: "csv", rows: parseCsv(csv) }]);
  assert.deepEqual(r.followers.map((f) => [f.platform, f.day, f.gained, f.lost, f.total]), [
    ["x", "2025-10-03", 5, 2, null], ["x", "2025-10-04", 3, 0, null],
  ]);
  assert.equal(r.daily.length, 2);
});

test("a normal engagement sheet produces no follower rows", () => {
  const r = parseWorkbook([{ name: "ENGAGEMENT", rows: [["Date", "Impressions", "Engagements"], ["9/30/2025", 120, 5]] }]);
  assert.equal(r.followers.length, 0);
});

test("a file with only followers is still recognised", () => {
  const r = parseWorkbook([{ name: "FOLLOWERS", rows: [["Date", "Total followers"], ["1/5/2026", 10]] }]);
  assert.equal(r.daily.length + r.posts.length, 0);
  assert.equal(r.followers.length, 1);
});
