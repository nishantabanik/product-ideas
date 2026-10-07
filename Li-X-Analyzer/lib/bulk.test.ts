import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBulkRows, parsePlatform, parseWhen } from "./bulk.ts";

test("platform aliases", () => {
  assert.equal(parsePlatform("Twitter"), "x");
  assert.equal(parsePlatform(" LinkedIn "), "linkedin");
  assert.equal(parsePlatform("Both"), "both");
  assert.equal(parsePlatform("insta"), null);
});

test("dates: text, default time, separate time column, Excel Date", () => {
  assert.equal(parseWhen("2026-10-12 14:30", "").value, "2026-10-12T14:30");
  assert.equal(parseWhen("2026-10-12", "").value, "2026-10-12T09:00");
  assert.equal(parseWhen("2026-10-12", "18:05").value, "2026-10-12T18:05");
  assert.equal(parseWhen(new Date(Date.UTC(2026, 9, 12, 8, 0)), "").value, "2026-10-12T08:00");
  assert.ok(parseWhen("2026-02-30", "").error);
  assert.ok(parseWhen("12/10/2026", "").error);
});

test("full file with good and bad rows", () => {
  const { rows, error } = parseBulkRows([
    ["Date", "Time", "Platform", "Content"],
    ["2026-10-06", "09:00", "x", "Hello X"],
    ["2026-10-07", "", "LinkedIn", "Hello LI"],
    [],
    ["2026-10-08", "10:00", "both", "a".repeat(300)],
    ["nope", "", "x", "bad date"],
    ["2026-10-06", "09:00", "x", "Hello X"],
  ]);
  assert.equal(error, undefined);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.errors.length), [0, 0, 1, 1, 1]);
  assert.match(rows[2].errors[0], /280/);
  assert.equal(rows[0].line, 2);
  assert.equal(rows[2].line, 5);
});

test("missing columns are reported", () => {
  assert.match(parseBulkRows([["date", "text"]]).error!, /platform/);
  assert.match(parseBulkRows([[]]).error!, /empty/);
});
