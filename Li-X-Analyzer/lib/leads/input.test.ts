import test from "node:test";
import assert from "node:assert/strict";
import { parseLeadInput, parseLeadPatch } from "./input.ts";

test("lead input", () => {
  assert.equal(parseLeadInput({ platform: "tiktok", name: "A" }).ok, false);
  assert.equal(parseLeadInput({ platform: "x", name: "  " }).ok, false);
  assert.equal(parseLeadInput({ platform: "x", name: "A", value: -1 }).ok, false);
  assert.equal(parseLeadInput({ platform: "x", name: "A", value: "abc" }).ok, false);
  assert.equal(parseLeadInput({ platform: "x", name: "A", source: "spam" }).ok, false);
  assert.equal(parseLeadInput({ platform: "x", name: "A", nextStepAt: "nope" }).ok, false);
  const r = parseLeadInput({ platform: "linkedin", name: " Ann ", handle: "@ann", profileUrl: "linkedin.com/in/ann", value: "1,200", nextStepAt: "2026-07-01" });
  assert.ok(r.ok);
  if (r.ok) { assert.equal(r.value.name, "Ann"); assert.equal(r.value.handle, "ann"); assert.equal(r.value.profileUrl, "https://linkedin.com/in/ann"); assert.equal(r.value.value, 1200); assert.equal(r.value.source, "manual"); }
});

test("lead patch", () => {
  assert.equal(parseLeadPatch({}).ok, false);
  assert.equal(parseLeadPatch({ stage: "nope" }).ok, false);
  assert.equal(parseLeadPatch({ name: "" }).ok, false);
  const r = parseLeadPatch({ stage: "won", value: null, nextStepAt: "" });
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.value, { stage: "won", value: null, nextStepAt: null });
});
