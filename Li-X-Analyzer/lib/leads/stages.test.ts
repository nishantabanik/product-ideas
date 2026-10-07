import test from "node:test";
import assert from "node:assert/strict";
import { avgDaysToWon, canMove, daysSinceContact, followUpsDue, movesSetContact, openPipelineValue, parsePeople, pipelineTotals, staleLeads, STAGES, winRate, winRateLabel, wonValue, type LeadFact } from "./stages.ts";

const now = new Date("2026-06-30T12:00:00Z");
const L = (o: Partial<LeadFact> & { id: string }): LeadFact => ({ stage: "new", value: null, createdAt: "2026-06-01T00:00:00Z", ...o });

test("stage order and moves", () => {
  assert.deepEqual([...STAGES], ["new", "contacted", "conversation", "proposal", "won", "lost"]);
  assert.ok(canMove("won", "new"));
  assert.ok(movesSetContact("contacted") && movesSetContact("conversation"));
  assert.ok(!movesSetContact("proposal") && !movesSetContact("new"));
});

test("empty data", () => {
  assert.equal(pipelineTotals([]).length, 6);
  assert.ok(pipelineTotals([]).every((t) => t.count === 0 && t.value === 0));
  assert.equal(openPipelineValue([]), 0);
  assert.equal(wonValue([]), 0);
  assert.equal(winRate([]), "n/a");
  assert.equal(avgDaysToWon([]), null);
  assert.deepEqual(followUpsDue([], now), []);
  assert.deepEqual(staleLeads([], now), []);
});

test("totals and values", () => {
  const ls = [L({ id: "a", value: 100 }), L({ id: "b", stage: "contacted", value: 50 }), L({ id: "c", stage: "won", value: 300 }), L({ id: "d", stage: "lost", value: 999 }), L({ id: "e", stage: "proposal" })];
  const t = Object.fromEntries(pipelineTotals(ls).map((x) => [x.stage, x]));
  assert.equal(t.new.value, 100);
  assert.equal(t.proposal.count, 1);
  assert.equal(t.proposal.value, 0);
  assert.equal(openPipelineValue(ls), 150);
  assert.equal(wonValue(ls), 300);
});

test("win rate", () => {
  assert.equal(winRate([L({ id: "a" })]), "n/a");
  assert.equal(winRate([L({ id: "a", stage: "won" }), L({ id: "b", stage: "lost" }), L({ id: "c", stage: "lost" }), L({ id: "d", stage: "lost" })]), 0.25);
  assert.equal(winRate([L({ id: "a", stage: "won" })]), 1);
  assert.equal(winRateLabel(0.333), "33%");
  assert.equal(winRateLabel("n/a"), "n/a");
});

test("average days to won", () => {
  const ls = [L({ id: "a", stage: "won", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" }), L({ id: "b", stage: "won", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-05T00:00:00Z" }), L({ id: "c", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-06-05T00:00:00Z" })];
  assert.equal(avgDaysToWon(ls), 7);
  assert.equal(avgDaysToWon([L({ id: "x", stage: "won", updatedAt: null })]), null);
});

test("follow ups due include the boundary and skip closed leads", () => {
  const ls = [
    L({ id: "now", nextStepAt: now.toISOString() }),
    L({ id: "past", stage: "contacted", nextStepAt: "2026-06-01T00:00:00Z" }),
    L({ id: "future", nextStepAt: "2026-06-30T12:00:01Z" }),
    L({ id: "won", stage: "won", nextStepAt: "2026-06-01T00:00:00Z" }),
    L({ id: "lost", stage: "lost", nextStepAt: "2026-06-01T00:00:00Z" }),
    L({ id: "none" }),
  ];
  assert.deepEqual(followUpsDue(ls, now).map((l) => l.id), ["past", "now"]);
});

test("stale leads at the 14 day boundary", () => {
  const ago = (d: number, extraMs = 0) => new Date(now.getTime() - d * 86_400_000 - extraMs).toISOString();
  const ls = [
    L({ id: "exact", stage: "contacted", lastContactAt: ago(14) }),
    L({ id: "almost", stage: "conversation", lastContactAt: ago(14, -1000) }),
    L({ id: "old", stage: "proposal", lastContactAt: ago(40) }),
    L({ id: "newstage", stage: "new", lastContactAt: ago(40) }),
    L({ id: "won", stage: "won", lastContactAt: ago(40) }),
    L({ id: "never", stage: "contacted", lastContactAt: null }),
  ];
  assert.deepEqual(staleLeads(ls, now).map((l) => l.id), ["old", "exact"]);
});

test("days since contact", () => {
  assert.equal(daysSinceContact(null, now), null);
  assert.equal(daysSinceContact("2026-06-30T00:00:00Z", now), 0);
  assert.equal(daysSinceContact("2026-06-27T11:00:00Z", now), 3);
  assert.equal(daysSinceContact("2026-07-02T00:00:00Z", now), 0);
  assert.equal(daysSinceContact("garbage", now), null);
});

test("parse pasted people", () => {
  assert.deepEqual(parsePeople(""), []);
  assert.deepEqual(parsePeople("\n  \n"), []);
  assert.deepEqual(parsePeople("Ann Lee\n- Bob Ray, @bobray\nann lee\nCy,\n, nohandle"), [{ name: "Ann Lee", handle: null }, { name: "Bob Ray", handle: "bobray" }, { name: "Cy", handle: null }]);
  assert.equal(parsePeople("a\nb\nc", 2).length, 2);
});
