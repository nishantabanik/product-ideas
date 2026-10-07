import { test } from "node:test";
import assert from "node:assert/strict";
import { followUpsDue, personKey, quietConversations, type QuietRow } from "./quiet.ts";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
let n = 0;
const row = (o: Partial<QuietRow> = {}): QuietRow => ({ id: `c${++n}`, platform: "linkedin", authorName: "Jane Doe", authorHandle: null, status: "replied", commentedAt: ago(6), createdAt: ago(6), repliedAt: ago(5), followUpAt: null, ...o });

test("a replied comment with no news for 3 days is quiet", () => {
  const r = quietConversations([row()], NOW, 3);
  assert.equal(r.length, 1);
  assert.equal(r[0].days, 5);
});

test("boundary: exactly 3 days counts, just under does not", () => {
  assert.equal(quietConversations([row({ repliedAt: ago(3) })], NOW, 3).length, 1);
  assert.equal(quietConversations([row({ repliedAt: new Date(NOW - 3 * 86_400_000 + 1).toISOString() })], NOW, 3).length, 0);
});

test("a newer message from the same person cancels it, an older one does not", () => {
  const replied = row({ repliedAt: ago(5) });
  assert.equal(quietConversations([replied, row({ status: "new", commentedAt: ago(1), createdAt: ago(1), repliedAt: null })], NOW, 3).length, 0);
  assert.equal(quietConversations([replied, row({ status: "new", commentedAt: ago(8), createdAt: ago(8), repliedAt: null })], NOW, 3).length, 1);
  // a newer comment that we ignored still means they wrote again
  assert.equal(quietConversations([replied, row({ status: "ignored", commentedAt: ago(2), createdAt: ago(2), repliedAt: null })], NOW, 3).length, 0);
});

test("a message at the very same moment as our reply does not cancel", () => {
  assert.equal(quietConversations([row({ repliedAt: ago(5) }), row({ status: "new", commentedAt: ago(5), repliedAt: null })], NOW, 3).length, 1);
});

test("new and ignored comments are never quiet", () => {
  assert.equal(quietConversations([row({ status: "new", repliedAt: null })], NOW, 3).length, 0);
  assert.equal(quietConversations([row({ status: "ignored" })], NOW, 3).length, 0);
  assert.equal(quietConversations([row({ repliedAt: null })], NOW, 3).length, 0);
});

test("dismissing the latest reply does not bring back an older one", () => {
  const older = row({ repliedAt: ago(9), commentedAt: ago(10) });
  const latest = row({ repliedAt: ago(4), commentedAt: ago(9), status: "ignored" });
  assert.equal(quietConversations([older, latest], NOW, 3).length, 0);
});

test("a person with several replied comments appears once with the latest", () => {
  const a = row({ repliedAt: ago(9), commentedAt: ago(10) });
  const b = row({ repliedAt: ago(5), commentedAt: ago(9) });
  const r = quietConversations([a, b], NOW, 3);
  assert.equal(r.length, 1);
  assert.equal(r[0].row.id, b.id);
});

test("people are matched by platform and handle, else by name", () => {
  assert.equal(personKey(row({ authorHandle: "@Jane" })), personKey(row({ authorName: "J. D.", authorHandle: "jane" })));
  assert.notEqual(personKey(row({ authorHandle: "jane" })), personKey(row({ platform: "x", authorHandle: "jane" })));
  assert.equal(personKey(row({ authorName: " jane  DOE " })), personKey(row()));
  assert.notEqual(personKey(row({ authorName: "Sam" })), personKey(row()));
  // same handle with different display names is one person, so a newer message under another name cancels
  const a = row({ authorHandle: "@jane", authorName: "Jane" });
  const b = row({ authorHandle: "jane", authorName: "Jane D", status: "new", commentedAt: ago(1), repliedAt: null });
  assert.equal(quietConversations([a, b], NOW, 3).length, 0);
  // another person does not cancel
  assert.equal(quietConversations([row(), row({ authorName: "Sam", status: "new", commentedAt: ago(1), repliedAt: null })], NOW, 3).length, 1);
});

test("empty input and ordering", () => {
  assert.deepEqual(quietConversations([], NOW, 3), []);
  const r = quietConversations([row({ authorName: "A", repliedAt: ago(4) }), row({ authorName: "B", repliedAt: ago(8), commentedAt: ago(9) })], NOW, 3);
  assert.deepEqual(r.map((x) => x.row.authorName), ["B", "A"]);
});

test("follow ups due: only dates that have come, not ignored, oldest first", () => {
  const rows = [
    row({ followUpAt: ago(1) }), row({ followUpAt: ago(3) }), row({ followUpAt: new Date(NOW).toISOString() }),
    row({ followUpAt: new Date(NOW + 1).toISOString() }), row({ followUpAt: null }), row({ followUpAt: ago(2), status: "ignored" }), row({ followUpAt: "garbage" }),
  ];
  const r = followUpsDue(rows, NOW);
  assert.equal(r.length, 3);
  assert.deepEqual(r.map((x) => x.followUpAt), [ago(3), ago(1), new Date(NOW).toISOString()]);
});
