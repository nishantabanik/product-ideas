import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, changeOf, isoWeek, reportPeriod, type ReportInput } from "./report.ts";

const at = (s: string) => new Date(`${s}T10:00:00Z`);

test("weekly period is the last full Monday to Sunday", () => {
  const p = reportPeriod("weekly", at("2026-10-05")); // a Monday
  assert.deepEqual([p.from, p.to, p.key], ["2026-09-28", "2026-10-04", "2026-W40"]);
  assert.deepEqual([p.prevFrom, p.prevTo], ["2026-09-21", "2026-09-27"]);
  const mid = reportPeriod("weekly", at("2026-10-07")); // Wednesday, same answer
  assert.equal(mid.key, "2026-W40");
  const sun = reportPeriod("weekly", at("2026-10-04")); // Sunday, the week is not over
  assert.deepEqual([sun.from, sun.to], ["2026-09-21", "2026-09-27"]);
  assert.equal(p.days, 7);
});

test("weekly period across the year change uses the ISO year", () => {
  const p = reportPeriod("weekly", at("2027-01-04")); // Monday
  assert.deepEqual([p.from, p.to, p.key], ["2026-12-28", "2027-01-03", "2026-W53"]);
  const q = reportPeriod("weekly", at("2026-01-05"));
  assert.deepEqual([q.from, q.to, q.key], ["2025-12-29", "2026-01-04", "2026-W01"]);
});

test("iso week numbers", () => {
  assert.deepEqual(isoWeek("2026-01-01"), { year: 2026, week: 1 });
  assert.deepEqual(isoWeek("2021-01-03"), { year: 2020, week: 53 });
  assert.deepEqual(isoWeek("2024-12-30"), { year: 2025, week: 1 });
  assert.deepEqual(isoWeek("2026-10-04"), { year: 2026, week: 40 });
});

test("monthly period: normal, year change and leap year", () => {
  const p = reportPeriod("monthly", at("2026-10-01"));
  assert.deepEqual([p.from, p.to, p.key, p.days, p.prevFrom, p.prevTo], ["2026-09-01", "2026-09-30", "2026-09", 30, "2026-08-01", "2026-08-31"]);
  const j = reportPeriod("monthly", at("2027-01-15"));
  assert.deepEqual([p.freq, j.from, j.to, j.key, j.prevFrom, j.prevTo], ["monthly", "2026-12-01", "2026-12-31", "2026-12", "2026-11-01", "2026-11-30"]);
  const f = reportPeriod("monthly", at("2028-03-01"));
  assert.deepEqual([f.from, f.to, f.days, f.prevTo], ["2028-02-01", "2028-02-29", 29, "2028-01-31"]);
  const n = reportPeriod("monthly", at("2027-03-01"));
  assert.equal(n.days, 28);
  assert.equal(n.label, "February 2027");
  const m = reportPeriod("monthly", at("2026-03-02"));
  assert.equal(m.prevTo, "2026-01-31");
});

test("changeOf", () => {
  assert.equal(changeOf(110, 100), 10);
  assert.equal(changeOf(5, 0), null);
  assert.equal(changeOf(null, 5), null);
  assert.ok(Math.abs(changeOf(0.06, 0.05, "rate")! - 1) < 1e-9);
});

const period = reportPeriod("weekly", at("2026-10-05"));
const days = (from: string, vals: (number | null)[]) => vals.map((v, i) => ({ day: new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10), impressions: v, engagements: v === null ? null : Math.round(v / 10) }));
const base: ReportInput = {
  period,
  linkedin: { cur: days("2026-09-28", [100, 200, 300, 400, 500, 600, 700]), prev: days("2026-09-21", [100, 100, 100, 100, 100, 100, 100]) },
  x: { weeks: [{ impressions: 900, likes: 20, comments: 5, shares: 5 }, { impressions: 1000, likes: 30, comments: 5, shares: 5 }], capturedAt: "2026-10-05T04:00:00Z" },
  topPosts: [
    { id: "a", platform: "linkedin", content: "Our best post about pricing", publishedAt: "2026-09-30T08:00:00Z", impressions: 1200, engagements: 80, url: null },
    { id: "b", platform: "x", content: "b", publishedAt: null, impressions: 10, engagements: 1, url: null },
    { id: "c", platform: "x", content: "c", publishedAt: null, impressions: 9, engagements: 1, url: null },
    { id: "d", platform: "x", content: "d", publishedAt: null, impressions: 8, engagements: 1, url: null },
  ],
  followers: [{ platform: "linkedin", total: 1250, change: 12, previousChange: 4, days: 7 }],
  goals: [{ id: "g", platform: "linkedin", metric: "impressions", period: "month", target: 100000, current: 20000, projected: 60000, requiredPerDay: 3500, status: "behind", label: "100,000 impressions a month on LinkedIn" }],
  pendingComments: 4,
};

test("report has KPIs with change, charts, top 3 and at most 3 next steps", () => {
  const r = buildReport(base);
  const li = r.kpis.filter((k) => k.platform === "linkedin");
  assert.equal(li[0].current, 2800);
  assert.equal(li[0].previous, 700);
  assert.equal(li[0].change, 300);
  assert.equal(r.kpis.filter((k) => k.platform === "x")[0].change, -10);
  assert.equal(r.topPosts.length, 3);
  assert.equal(r.charts.find((c) => c.platform === "linkedin")!.bars.length, 7);
  assert.equal(r.charts.find((c) => c.platform === "x")!.unit, "week");
  assert.ok(r.nextSteps.length >= 2 && r.nextSteps.length <= 3);
  assert.match(r.nextSteps[0], /behind/);
  assert.match(r.followers[0].line, /1,250 followers, \+12/);
  assert.ok(r.notes.some((n) => /weekly totals/.test(n)));
});

test("missing data produces notes and skips next steps instead of inventing", () => {
  const r = buildReport({ ...base, linkedin: { cur: [], prev: [] }, x: null, topPosts: [], followers: [], goals: [], pendingComments: null });
  assert.equal(r.kpis.length, 0);
  assert.equal(r.charts.length, 0);
  assert.deepEqual(r.nextSteps, []);
  assert.equal(r.notes.length, 3);
});

test("missing days are left empty and mentioned; zero pending comments gives no line", () => {
  const cur = days("2026-09-28", [100, null, 300, null, null, 600, 700]);
  const r = buildReport({ ...base, linkedin: { cur, prev: [] }, pendingComments: 0, goals: [] });
  const c = r.charts[0];
  assert.equal(c.bars[1].value, null);
  assert.match(c.note!, /3 of 7/);
  assert.equal(r.kpis[0].change, null);
  assert.ok(!r.nextSteps.some((s) => /comment/.test(s)));
});

test("a big drop is called out", () => {
  const r = buildReport({ ...base, linkedin: { cur: days("2026-09-28", [10, 10, 10, 10, 10, 10, 10]), prev: days("2026-09-21", [100, 100, 100, 100, 100, 100, 100]) }, goals: [], pendingComments: 0 });
  assert.ok(r.nextSteps.some((s) => /fell 90%/.test(s)));
});

test("monthly report asks X for several weeks and says when it has too few", () => {
  const monthly = reportPeriod("monthly", at("2026-10-01"));
  const r = buildReport({ ...base, period: monthly, linkedin: { cur: [], prev: [] }, x: { weeks: base.x!.weeks, capturedAt: null } });
  assert.equal(r.kpis.filter((k) => k.platform === "x").length, 0); // only 2 weeks, a month needs 4
});

import { reportDue, reportEmail } from "./report.ts";

test("reportDue sends once per period and catches up", () => {
  assert.equal(reportDue("off", at("2026-10-05"), null).due, false);
  assert.equal(reportDue(null, at("2026-10-05"), null).due, false);
  assert.equal(reportDue("weekly", at("2026-10-05"), null).due, true);
  assert.equal(reportDue("weekly", at("2026-10-05"), "2026-W40").due, false);
  assert.equal(reportDue("weekly", at("2026-10-07"), "2026-W39").due, true); // missed Monday
  assert.equal(reportDue("weekly", at("2026-10-11"), "2026-W40").due, false); // Sunday, week 41 not over
  assert.equal(reportDue("monthly", at("2026-10-01"), "2026-08").due, true);
  assert.equal(reportDue("monthly", at("2026-10-20"), "2026-09").due, false);
});

test("email body escapes text and lists the headline numbers", () => {
  const r = buildReport(base);
  r.nextSteps.push("<script>alert(1)</script>");
  const e = reportEmail(r);
  assert.match(e.subject, /Weekly report/);
  assert.match(e.html, /&lt;script&gt;/);
  assert.ok(!e.html.includes("<script>"));
  assert.match(e.text, /LinkedIn impressions: 2,800/);
});
