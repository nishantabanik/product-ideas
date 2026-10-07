import { test } from "node:test";
import assert from "node:assert/strict";
import { externalId, linkedinUrn } from "./ids.ts";

test("ids come out of X and LinkedIn links", () => {
  assert.equal(externalId("https://x.com/me/status/1234567890?s=20"), "1234567890");
  assert.equal(externalId("https://twitter.com/me/status/55"), "55");
  assert.equal(externalId("https://www.linkedin.com/feed/update/urn:li:activity:7000000000123/"), "7000000000123");
  assert.equal(externalId("https://www.linkedin.com/feed/update/urn:li:ugcPost:7000000000999"), "7000000000999");
  assert.equal(externalId("https://example.com/x"), null);
  assert.equal(externalId(null), null);
});

test("a LinkedIn link gives the URN used to reply", () => {
  assert.equal(linkedinUrn("https://www.linkedin.com/feed/update/urn:li:activity:7000000000123/"), "urn:li:activity:7000000000123");
  assert.equal(linkedinUrn("https://x.com/me/status/1"), null);
});
