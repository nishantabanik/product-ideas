import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDatabaseUrl } from "./db.ts";

test("drops channel_binding but keeps sslmode and the rest", () => {
  const out = new URL(cleanDatabaseUrl("postgresql://u:p@h.neon.tech/neondb?sslmode=require&channel_binding=require"));
  assert.equal(out.searchParams.get("channel_binding"), null);
  assert.equal(out.searchParams.get("sslmode"), "require");
  assert.equal(out.username, "u");
  assert.equal(out.pathname, "/neondb");
});
