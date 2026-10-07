import { test } from "node:test";
import assert from "node:assert/strict";
import { open, seal } from "./secret-box.ts";

process.env.SESSION_SECRET = "test-secret";

test("a sealed value opens to the same value", () => {
  const v = { token: "abc", n: 5, nested: { ok: true } };
  assert.deepEqual(open(seal(v)), v);
});

test("the sealed text does not contain the secret and differs every time", () => {
  const a = seal({ token: "super-secret-token" }), b = seal({ token: "super-secret-token" });
  assert.ok(!a.includes("super-secret-token"));
  assert.notEqual(a, b);
});

test("a changed secret or a tampered value cannot be opened", () => {
  const box = seal({ x: 1 });
  process.env.SESSION_SECRET = "another-secret";
  assert.throws(() => open(box));
  process.env.SESSION_SECRET = "test-secret";
  const raw = Buffer.from(box, "base64");
  raw[raw.length - 1] ^= 1;
  assert.throws(() => open(raw.toString("base64")));
});
