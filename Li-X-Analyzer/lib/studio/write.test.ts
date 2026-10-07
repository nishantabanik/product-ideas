import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMATS, GROUPS, STRUCTURES, formatById, structureById } from "./formats.ts";
import { checkPost, fitX, plainText, readingGrade, X_MAX } from "./simple.ts";
import { fixPrompt, parseSections, stripChatter, WRITE_SYSTEM, writePrompt } from "./write-prompt.ts";
import { tweetLength } from "./thread.ts";

test("the format list is complete, unique and free of dashes", () => {
  assert.ok(FORMATS.length >= 60, String(FORMATS.length));
  assert.equal(STRUCTURES.length, 18);
  assert.equal(new Set(FORMATS.map((f) => f.id)).size, FORMATS.length);
  assert.equal(new Set(STRUCTURES.map((f) => f.id)).size, STRUCTURES.length);
  for (const g of GROUPS) assert.ok(FORMATS.some((f) => f.group === g), `${g} is empty`);
  for (const f of FORMATS) {
    assert.ok(f.name && f.example && f.guide.length > 30, f.id);
    assert.ok(GROUPS.includes(f.group as (typeof GROUPS)[number]), f.id);
    assert.doesNotMatch(`${f.name}${f.example}${f.guide}`, /[—–]/, `${f.id} has a dash`);
  }
  for (const s of STRUCTURES) { assert.ok(s.steps && s.guide.length > 20, s.id); assert.doesNotMatch(`${s.name}${s.steps}${s.guide}`, /[—–]/); }
  assert.equal(formatById("before-after")?.name, "Before and after");
  assert.equal(formatById("nope"), null);
  assert.equal(structureById("pas")?.steps, "Problem, Agitate, Solution");
});

test("typography is made plain", () => {
  assert.equal(plainText("We tried it — and it worked."), "We tried it, and it worked.");
  assert.equal(plainText("Two–three days"), "Two-three days");
  assert.equal(plainText("It’s “fine”"), `It's "fine"`);
  assert.equal(plainText("Wait —. Done"), "Wait. Done");
  assert.equal(plainText("a  b \n\n\n\n c "), "a b\n\nc");
  assert.doesNotMatch(plainText("x — y — z"), /—/);
});

test("reading grade tells easy from hard", () => {
  const easy = "I fixed a bug today. It was small. It took me a day. I felt proud. Then I told my team. They clapped for me.";
  const hard = "The implementation necessitated a comprehensive reconsideration of our organizational infrastructure, particularly regarding interdepartmental communication methodologies and accountability frameworks.";
  assert.ok(readingGrade(easy)! < 4, String(readingGrade(easy)));
  assert.ok(readingGrade(hard)! > 14, String(readingGrade(hard)));
  assert.equal(readingGrade("Too short."), null);
  assert.ok(readingGrade("Short line one\nShort line two here\nAnother little line goes here\nAnd a last one to end it") !== null);
});

test("an X post is cut to fit, at a sentence when it can", () => {
  const long = "This is the first sentence. ".repeat(20);
  const fit = fitX(long);
  assert.ok(tweetLength(fit) <= X_MAX);
  assert.match(fit, /sentence\.$/);
  assert.equal(fitX("Short and fine."), "Short and fine.");
  const oneBig = fitX("word ".repeat(200));
  assert.ok(tweetLength(oneBig) <= X_MAX);
  assert.match(oneBig, /\.\.\.$/);
  assert.ok(tweetLength(fitX("x".repeat(500))) <= X_MAX);
  assert.ok(tweetLength(fitX(`See https://example.com/a/very/long/link/here ${"word ".repeat(80)}`)) <= X_MAX);
});

test("post checks flag length, reading level and dashes", () => {
  assert.equal(checkPost("x", "I fixed a small bug today. It took a day. I felt good about it. Then I told my team.").length, 0);
  assert.ok(checkPost("x", "word ".repeat(100)).some((i) => /characters/.test(i.problem)));
  assert.ok(checkPost("linkedin", "The implementation necessitated a comprehensive reconsideration of organizational infrastructure and interdepartmental communication methodologies.").some((i) => /reading level/.test(i.problem)));
  assert.ok(checkPost("linkedin", "A thing — and another thing, which is fine for everyone to read.").some((i) => /dash/.test(i.problem)));
});

test("the writing prompt carries the topic, the format, the structure and each platform's size", () => {
  const p = writePrompt({ topic: "Our slow deploys", details: "It took 45 minutes. Now 4.", format: "before-after", structure: "bab", platforms: ["linkedin", "x"] });
  assert.match(p, /Our slow deploys/);
  assert.match(p, /It took 45 minutes/);
  assert.match(p, /Before and after/);
  assert.match(p, /Before, After, Bridge/);
  assert.match(p, /===LINKEDIN===/);
  assert.match(p, /===X===/);
  assert.match(p, /at most 270 characters/);
  const onlyX = writePrompt({ topic: "t", format: "hot-take", platforms: ["x"] });
  assert.doesNotMatch(onlyX, /===LINKEDIN===/);
  assert.match(onlyX, /No extra facts/);
  assert.throws(() => writePrompt({ topic: "t", format: "unknown", platforms: ["x"] }), /Choose a story format/);
  assert.match(WRITE_SYSTEM, /Class 5/);
  assert.match(WRITE_SYSTEM, /Never use em dashes/);
  assert.match(fixPrompt({ x: "Long post" }, [{ platform: "x", problem: "Too long." }]), /Too long\./);
});

test("the answer is read from marker lines, however the model spells them", () => {
  const both: ("linkedin" | "x")[] = ["linkedin", "x"];
  const std = parseSections("===LINKEDIN===\nLine one.\n\nLine two.\n===X===\nShort post.", both);
  assert.equal(std.linkedin, "Line one.\n\nLine two.");
  assert.equal(std.x, "Short post.");
  const chatty = parseSections("Sure! Here you go:\n\n**LinkedIn post:**\nHello there.\n\n**X post:**\nHi.\n\nHope that helps!", both);
  assert.equal(chatty.linkedin, "Hello there.");
  assert.equal(chatty.x, "Hi.");
  const lower = parseSections("=== linkedin ===\n```\nIn a fence.\n```\n=== x ===\nTwo.", both);
  assert.equal(lower.linkedin, "In a fence.");
  assert.equal(lower.x, "Two.");
  const hashes = parseSections("## LinkedIn\nA\n## X\nB", both);
  assert.deepEqual(hashes, { linkedin: "A", x: "B" });
});

test("a single post can come without any marker, two cannot", () => {
  assert.deepEqual(parseSections("Just the post, nothing else.", ["x"]), { x: "Just the post, nothing else." });
  assert.deepEqual(parseSections("```\nFenced post\n```", ["linkedin"]), { linkedin: "Fenced post" });
  assert.deepEqual(parseSections("No markers at all", ["linkedin", "x"]), {});
  assert.deepEqual(parseSections("", ["x"]), {});
  assert.deepEqual(parseSections("===X===\nOnly X", ["linkedin", "x"]), { x: "Only X" });
  assert.equal(parseSections("===LINKEDIN===\nA line that mentions X in the middle of a sentence\nand more", ["linkedin", "x"]).linkedin, "A line that mentions X in the middle of a sentence\nand more");
});

test("a closing remark from the model is not part of the post", () => {
  assert.equal(stripChatter("A good post.\n\nLet me know if you want changes!"), "A good post.");
  assert.equal(stripChatter("A good post.\n\nSecond part.\n\nHope this helps"), "A good post.\n\nSecond part.");
  assert.equal(stripChatter("Let me know is a title."), "Let me know is a title.");
  assert.equal(stripChatter("Plain post."), "Plain post.");
  assert.equal(parseSections("===X===\nShort one.\n\nFeel free to ask for more.", ["x"]).x, "Short one.");
});
