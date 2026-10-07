import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { buildPdf, sanitize } from "./pdf.ts";
import { buildReport, reportPeriod, type ReportInput } from "./report.ts";

const period = reportPeriod("weekly", new Date("2026-10-05T10:00:00Z"));
const days = (vals: (number | null)[]) => vals.map((v, i) => ({ day: new Date(Date.parse("2026-09-28T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10), impressions: v, engagements: v === null ? null : Math.round(v / 10) }));

const input = (over: Partial<ReportInput> = {}): ReportInput => ({
  period,
  linkedin: { cur: days([100, 200, 300, 400, 500, 600, 700]), prev: days([100, 100, 100, 100, 100, 100, 100]) },
  x: { weeks: [{ impressions: 900, likes: 20, comments: 5, shares: 5 }, { impressions: 1000, likes: 30, comments: 5, shares: 5 }], capturedAt: "2026-10-05T04:00:00Z" },
  topPosts: [{ id: "a", platform: "linkedin", content: "Our best post about pricing", publishedAt: "2026-09-30T08:00:00Z", impressions: 1200, engagements: 80, url: null }],
  followers: [{ platform: "linkedin", total: 1250, change: 12, previousChange: 4, days: 7 }],
  goals: [{ id: "g", platform: "linkedin", metric: "impressions", period: "month", target: 100000, current: 20000, projected: 60000, requiredPerDay: 3500, status: "behind", label: "100,000 impressions a month on LinkedIn" }],
  pendingComments: 4, ...over,
});

async function check(bytes: Uint8Array) {
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString("latin1"), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 1);
  return doc;
}

test("builds a PDF from sample data", async () => {
  const doc = await check(await buildPdf(buildReport(input())));
  assert.equal(doc.getPage(0).getSize().width.toFixed(0), "595");
});

test("builds a PDF from an empty report", async () => {
  await check(await buildPdf(buildReport(input({ linkedin: { cur: [], prev: [] }, x: null, topPosts: [], followers: [], goals: [], pendingComments: null }))));
});

test("weird characters do not throw", async () => {
  const weird = "“Smart quotes” ‘x’ — emoji 🚀🔥 café 日本語 Привет مرحبا ​ zero‍width tab\there";
  const r = buildReport(input({ topPosts: [{ id: "a", platform: "x", content: weird, publishedAt: null, impressions: 5, engagements: 1, url: null }] }));
  r.goals.push(weird);
  r.nextSteps.push(weird);
  await check(await buildPdf(r));
});

test("sanitize keeps what the font can draw and swaps the rest", async () => {
  assert.equal(await sanitize("“hi” — it’s café"), '"hi" - it\'s café');
  assert.equal(await sanitize("rocket 🚀🚀 done"), "rocket ? done");
  assert.equal(await sanitize("Ševčík"), "Ševcík"); // c with caron has no WinAnsi form, so its base letter is used
  assert.equal(await sanitize("日本"), "?");
});

test("very long words and many posts wrap and paginate", async () => {
  const long = "A".repeat(400) + " " + "word ".repeat(300);
  const r = buildReport(input());
  r.topPosts = [1, 2, 3].map((i) => ({ id: `${i}`, platform: "linkedin" as const, content: long, publishedAt: null, impressions: 1, engagements: 1, url: null }));
  r.notes = Array.from({ length: 60 }, (_, i) => `Note ${i} ${long.slice(0, 200)}`);
  const doc = await check(await buildPdf(r));
  assert.ok(doc.getPageCount() > 1);
});
