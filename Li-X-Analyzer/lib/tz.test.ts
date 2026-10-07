import { test } from "node:test";
import assert from "node:assert/strict";
import { zonedToUtc } from "./tz.ts";

test("summer time in Berlin is UTC+2", () => {
  assert.equal(zonedToUtc("2026-10-12T09:00", "Europe/Berlin").toISOString(), "2026-10-12T07:00:00.000Z");
});
test("winter time in New York is UTC-5", () => {
  assert.equal(zonedToUtc("2026-01-15T09:00", "America/New_York").toISOString(), "2026-01-15T14:00:00.000Z");
});
test("half hour offsets work (Kolkata)", () => {
  assert.equal(zonedToUtc("2026-10-12T09:00", "Asia/Kolkata").toISOString(), "2026-10-12T03:30:00.000Z");
});
test("UTC is unchanged", () => {
  assert.equal(zonedToUtc("2026-10-12T09:00", "UTC").toISOString(), "2026-10-12T09:00:00.000Z");
});
test("rejects garbage", () => {
  assert.throws(() => zonedToUtc("tomorrow", "UTC"));
});
