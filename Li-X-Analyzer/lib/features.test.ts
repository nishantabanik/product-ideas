import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CATALOG, featureCount } from "./features-catalog.ts";

test("every feature points to a page that exists", () => {
  for (const g of CATALOG) for (const f of g.features) {
    const page = join(process.cwd(), "app", f.href === "/" ? "" : f.href, "page.tsx");
    assert.ok(existsSync(page), `${f.name} points to ${f.href}, but ${page} is missing`);
  }
});

test("features have a name, a description and a place, and names are unique", () => {
  const names = new Set<string>();
  for (const g of CATALOG) for (const f of g.features) {
    assert.ok(f.name && f.what && f.where, f.name);
    assert.ok(f.enable && f.enable.length > 15, `${f.name} must say how to enable it`);
    assert.ok(!names.has(f.name), `duplicate ${f.name}`);
    names.add(f.name);
  }
  assert.equal(names.size, featureCount());
});
