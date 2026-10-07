import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfile, estimateTokens, parseSkillFile, validateAsset, type Asset } from "./assets.ts";
import { OUTPUTS, outputById } from "./formats.ts";

const a = (kind: Asset["kind"], name: string, body: string): Asset => ({ id: name, kind, name, body, platform: "both", active: true, position: 0 });

test("an asset is checked and cleaned", () => {
  assert.deepEqual(validateAsset({ kind: "tone", name: "  Warm   and plain ", body: " Friendly. \r\nDirect. ", platform: "x", active: true }), { kind: "tone", name: "Warm and plain", body: "Friendly. \nDirect.", platform: "x", active: true });
  assert.equal(validateAsset({ kind: "memory", name: "Me", body: "I am a developer" }).platform, "both");
  assert.throws(() => validateAsset({ kind: "nope", name: "x", body: "y" }), /Unknown kind/);
  assert.throws(() => validateAsset({ kind: "tone", name: " ", body: "y" }), /name/);
  assert.throws(() => validateAsset({ kind: "tone", name: "x", body: "" }), /what it says/);
  assert.throws(() => validateAsset({ kind: "tone", name: "x", body: "y".repeat(1600) }), /at most 1,500/);
  assert.doesNotThrow(() => validateAsset({ kind: "skill", name: "x", body: "y".repeat(20000) }));
});

test("a skill file is read with or without front matter", () => {
  const withFm = parseSkillFile('---\nname: linkedin-writer\ndescription: "Write posts that get replies"\n---\n\n# Ignore me\nDo this.\n', "x.md");
  assert.equal(withFm.name, "linkedin-writer");
  assert.equal(withFm.description, "Write posts that get replies");
  assert.equal(withFm.body, "# Ignore me\nDo this.");
  assert.equal(parseSkillFile("# Hook rules\nStart strong.", "hooks.md").name, "Hook rules");
  assert.equal(parseSkillFile("Just text.", "my_skill-file.md").name, "my skill file");
  assert.equal(parseSkillFile("﻿---\r\nname: bom\r\n---\r\nbody", "a.md").name, "bom");
  assert.equal(parseSkillFile("", "").name, "Skill");
});

test("the profile holds tone, rules, memory and skills, and nothing when empty", () => {
  assert.equal(buildProfile({ styles: [], memories: [], skills: [] }).text, "");
  const p = buildProfile({ tone: a("tone", "Warm", "Friendly and direct."), styles: [a("style", "Short lines", "One idea per line.")], memories: [a("memory", "Who we are", "A DevOps engineer in Berlin.")], skills: [a("skill", "Hook skill", "Open with a number.")] });
  assert.match(p.text, /Our tone:\nFriendly and direct\./);
  assert.match(p.text, /- Short lines: One idea per line\./);
  assert.match(p.text, /- Who we are: A DevOps engineer in Berlin\./);
  assert.match(p.text, /### Hook skill\nOpen with a number\./);
  assert.match(p.text, /always come first/);
  assert.deepEqual(p.shortened, []);
});

test("big skill files are shortened to fit the budget and are reported", () => {
  const big = "Paragraph one is here.\n\n".repeat(900);
  const p = buildProfile({ tone: a("tone", "Warm", "Friendly."), styles: [], memories: [], skills: [a("skill", "Big one", big), a("skill", "Big two", big)] }, 6000);
  assert.ok(p.chars < 6400, String(p.chars));
  assert.deepEqual(p.shortened, ["Big one", "Big two"]);
  assert.match(p.text, /\[shortened\]/);
  assert.match(p.text, /Our tone:\nFriendly\./, "small items are never pushed out");
  const small = buildProfile({ styles: [], memories: [], skills: [a("skill", "Tiny", "Short skill.")] });
  assert.deepEqual(small.shortened, []);
});

test("token estimate and writing formats", () => {
  assert.equal(estimateTokens(4000), 1000);
  assert.equal(estimateTokens(1), 1);
  assert.ok(OUTPUTS.length >= 5);
  assert.equal(outputById("carousel")?.name, "Carousel outline");
  assert.equal(outputById("nope"), null);
  for (const o of OUTPUTS) assert.doesNotMatch(o.guide, /[—–]/);
});
