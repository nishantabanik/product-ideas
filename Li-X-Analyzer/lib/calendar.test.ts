import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, dayKey, gridDays, groupByDay, startOfWeek, type CalItem } from "./calendar.ts";

test("weeks start on Monday", () => {
  assert.equal(dayKey(startOfWeek(new Date(2026, 9, 11))), "2026-10-05"); // Sunday 11 Oct 2026
  assert.equal(dayKey(startOfWeek(new Date(2026, 9, 5))), "2026-10-05");
});

test("month grid is 6 whole weeks that contain the month", () => {
  const days = gridDays(new Date(2026, 9, 15), "month");
  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 1);
  const keys = days.map(dayKey);
  assert.ok(keys.includes("2026-10-01") && keys.includes("2026-10-31"));
});

test("week grid is 7 days", () => {
  assert.equal(gridDays(new Date(2026, 9, 7), "week").map(dayKey).join(), "2026-10-05,2026-10-06,2026-10-07,2026-10-08,2026-10-09,2026-10-10,2026-10-11");
});

test("addDays crosses month ends", () => {
  assert.equal(dayKey(addDays(new Date(2026, 9, 31), 1)), "2026-11-01");
});

test("posts group under their local day", () => {
  const d = new Date(2026, 9, 6, 9, 0);
  const item = (id: string): CalItem => ({ id, platform: "x", channel: "", state: "QUEUE", date: d.toISOString(), content: "", url: null });
  assert.equal(groupByDay([item("a"), item("b")]).get("2026-10-06")?.length, 2);
});
