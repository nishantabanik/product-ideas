import { test } from "node:test";
import assert from "node:assert/strict";
import { build, change, dayList, type DayRow } from "./analytics.ts";

const NOW = Date.UTC(2026, 9, 10, 15, 0);
const row = (platform: string, day: string, o: Partial<DayRow> = {}): DayRow =>
  ({ platform, day, posts: 1, impressions: 100, likes: 5, comments: 1, shares: 2, clicks: 0, ...o });

test("dayList is oldest first and ends today", () => {
  const d = dayList(NOW, 7);
  assert.equal(d.length, 7);
  assert.equal(d[6], "2026-10-10");
  assert.equal(d[0], "2026-10-04");
  assert.equal(dayList(NOW, 7, 1)[6], "2026-10-03");
});

test("build fills gaps with zero and splits by platform", () => {
  const b = build([row("x", "2026-10-10"), row("linkedin", "2026-10-09", { impressions: 400 })], NOW, 7, ["x", "linkedin"]);
  assert.deepEqual(b.perPlatform.x.impressions, [0, 0, 0, 0, 0, 0, 100]);
  assert.equal(b.perPlatform.linkedin.impressions[5], 400);
  assert.equal(b.total.impressions.current, 500);
});

test("previous period is the 7 days before", () => {
  const b = build([row("x", "2026-10-10"), row("x", "2026-10-03", { impressions: 50 })], NOW, 7, ["x"]);
  assert.equal(b.total.impressions.current, 100);
  assert.equal(b.total.impressions.previous, 50);
});

test("a single platform scope ignores the other", () => {
  const b = build([row("x", "2026-10-10"), row("linkedin", "2026-10-10")], NOW, 7, ["x"]);
  assert.equal(b.total.posts.current, 1);
  assert.equal(b.byPlatformTotal.linkedin.posts, 0);
});

test("change handles zero baselines", () => {
  assert.equal(change(150, 100), 50);
  assert.equal(change(0, 0), 0);
  assert.equal(change(5, 0), null);
});
