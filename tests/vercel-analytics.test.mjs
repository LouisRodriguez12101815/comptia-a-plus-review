import assert from "node:assert/strict";
import test from "node:test";
import { redactSearchQuery } from "../lib/vercel-analytics.ts";

test("Web Analytics redaction removes every search q value but preserves the route and other filters", () => {
  const event = redactSearchQuery({
    type: "pageview",
    url: "https://example.test/en/search?q=learner-secret&q=second&topic=n10#results",
  });

  assert.equal(event.url, "https://example.test/en/search?topic=n10#results");
  assert.ok(!event.url.includes("learner-secret"));
  assert.ok(!event.url.includes("q="));
});
