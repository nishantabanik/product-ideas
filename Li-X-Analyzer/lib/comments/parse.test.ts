import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCommentRows, parsePasted, relativeTime } from "./parse.ts";
import { parseLinkedinCommentLink } from "./links.ts";

test("blocks with an author line and a comment, with page noise removed", () => {
  const raw = `Jane Doe
Jane Doe
• 2nd
Product lead at Acme
2d
Great post, we saw the same thing last quarter.
Like
|
Reply
| 3 Reactions

Sam Lee • 1st
5h
Thanks for sharing this!
Like | Reply`;
  const r = parsePasted(raw);
  assert.equal(r.length, 2);
  assert.equal(r[0].author, "Jane Doe");
  assert.match(r[0].body, /Great post, we saw the same thing/);
  assert.ok(!/Reactions|Reply|2nd/.test(r[0].body.replace("Product lead at Acme", "")));
  assert.equal(r[0].when, "2d");
  assert.equal(r[1].author, "Sam Lee");
  assert.equal(r[1].body, "Thanks for sharing this!");
});

test("one line comments written as Author: comment", () => {
  const r = parsePasted("Ana: loved the pricing example\n\nBen: where can I read more?");
  assert.deepEqual(r.map((x) => [x.author, x.body]), [["Ana", "loved the pricing example"], ["Ben", "where can I read more?"]]);
});

test("a lone line with no author is ignored, not guessed", () => {
  assert.deepEqual(parsePasted("just some text without a name"), []);
  assert.deepEqual(parsePasted("   \n\n  "), []);
});

test("loose times become dates", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  assert.equal(relativeTime("2d", now), "2026-10-03T12:00:00.000Z");
  assert.equal(relativeTime("3 weeks ago", now), "2026-09-14T12:00:00.000Z");
  assert.equal(relativeTime("5h", now), "2026-10-05T07:00:00.000Z");
  assert.equal(relativeTime("yesterday", now), "2026-10-04T12:00:00.000Z");
  assert.equal(relativeTime("whenever", now), null);
  assert.equal(relativeTime(null, now), null);
});

test("a file of comments needs author and comment columns", () => {
  const ok = parseCommentRows([["Author", "Comment", "Date", "Link"], ["Ana", "Nice", "2026-10-01", "https://x"], ["", "", "", ""]]);
  assert.equal(ok.comments.length, 1);
  assert.deepEqual([ok.comments[0].author, ok.comments[0].body, ok.comments[0].link], ["Ana", "Nice", "https://x"]);
  assert.match(parseCommentRows([["a", "b"]]).error!, /author and comment/);
});

test("a LinkedIn comment link gives the comment and the post", () => {
  const encoded = "https://www.linkedin.com/feed/update/urn:li:activity:7000000000123/?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7000000000123%2C7000000000456%29";
  const a = parseLinkedinCommentLink(encoded)!;
  assert.equal(a.commentUrn, "urn:li:comment:(urn:li:activity:7000000000123,7000000000456)");
  assert.equal(a.postUrn, "urn:li:activity:7000000000123");
  assert.equal(a.commentId, "7000000000456");
  const plain = parseLinkedinCommentLink("urn:li:comment:(urn:li:ugcPost:55,66)")!;
  assert.equal(plain.postUrn, "urn:li:ugcPost:55");
  assert.equal(parseLinkedinCommentLink("https://www.linkedin.com/feed/update/urn:li:activity:1/"), null);
  assert.equal(parseLinkedinCommentLink(null), null);
});

test("pasted messages parse like comments, and clock times are page furniture", () => {
  const r = parsePasted("Jane Doe\n10:42 AM\nCan we talk about pricing?\n\nSam: Thanks for the intro");
  assert.deepEqual(r.map((c) => [c.author, c.body]), [["Jane Doe", "Can we talk about pricing?"], ["Sam", "Thanks for the intro"]]);
});
