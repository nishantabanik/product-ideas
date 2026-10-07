import { test } from "node:test";
import assert from "node:assert/strict";
import { fillTemplate, firstName, postSnippet } from "./fill.ts";
import { STARTER_TEMPLATES } from "./starters.ts";

test("first names from normal, odd and empty names", () => {
  assert.equal(firstName("Jane Doe"), "Jane");
  assert.equal(firstName("  anna  maria "), "Anna");
  assert.equal(firstName("Cher"), "Cher");
  assert.equal(firstName("Dr. Sam Lee"), "Sam");
  assert.equal(firstName("Jean-Luc Picard"), "Jean-Luc");
  assert.equal(firstName("John 🚀 Smith"), "John");
  assert.equal(firstName("🔥🔥"), "there");
  assert.equal(firstName(""), "there");
  assert.equal(firstName(null), "there");
  assert.equal(firstName("Unknown"), "there");
  assert.equal(firstName("@jane_doe"), "Jane");
  assert.equal(firstName("@12345"), "there");
  assert.equal(firstName("@x"), "there");
  assert.equal(firstName("JANE SMITH"), "Jane");
  assert.equal(firstName("McDonald Ray"), "McDonald");
  assert.equal(firstName("Zoë Ångström"), "Zoë");
});

test("post snippets are short, clean and null when empty", () => {
  assert.equal(postSnippet(""), null);
  assert.equal(postSnippet(null), null);
  assert.equal(postSnippet("   \n\n  "), null);
  assert.equal(postSnippet("https://x.com/a\nWhy pricing tests fail #saas"), "Why pricing tests fail");
  const s = postSnippet("We ran a long experiment about the pricing page and what changed for our customers over time", 50)!;
  assert.ok(s.endsWith("...") && s.length <= 53);
  assert.ok(!s.slice(0, -3).endsWith(" "));
});

test("filling names and posts, unknown brackets stay", () => {
  const r = fillTemplate("Hi [name], thanks for [post]. See [link] and [Name]", { name: "Jane Doe", post: "Pricing lessons\nmore text", platform: "linkedin" });
  assert.equal(r.text, "Hi Jane, thanks for Pricing lessons. See [link] and Jane");
  assert.equal(r.tooLong, false);
  assert.deepEqual(r.warnings, ["Fill in [link] before sending."]);
});

test("missing name and post fall back to neutral words", () => {
  const r = fillTemplate("Thanks [name] for [post]", { name: "", post: null, platform: "linkedin" });
  assert.equal(r.text, "Thanks there for our post");
});

test("X replies warn above 280 characters, exactly 280 is fine, LinkedIn never warns", () => {
  const body = "a".repeat(280);
  assert.equal(fillTemplate(body, { platform: "x" }).tooLong, false);
  const long = fillTemplate(body + "b", { platform: "x" });
  assert.equal(long.tooLong, true);
  assert.match(long.warnings[0], /281 characters/);
  assert.equal(fillTemplate(body + "b", { platform: "linkedin" }).tooLong, false);
  // the filled name counts, not the placeholder
  assert.equal(fillTemplate("[name]" + "a".repeat(277), { name: "Jane", platform: "x" }).tooLong, true);
});

test("there are four starters and they fit on X once filled", () => {
  assert.equal(STARTER_TEMPLATES.length, 4);
  for (const t of STARTER_TEMPLATES) assert.equal(fillTemplate(t.body, { name: "Alexandrina", post: "x".repeat(200), platform: "x" }).tooLong, false);
});
