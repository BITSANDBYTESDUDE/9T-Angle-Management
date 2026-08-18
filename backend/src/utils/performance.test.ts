import test from "node:test";
import assert from "node:assert/strict";
import { ratingFor, periodRange } from "../services/performance.service.js";

test("performance ratings use configured business bands", () => {
  assert.equal(ratingFor(95), "excellent"); assert.equal(ratingFor(85), "very-good"); assert.equal(ratingFor(75), "good"); assert.equal(ratingFor(65), "needs-improvement"); assert.equal(ratingFor(59), "poor");
});
test("weekly range starts Monday and spans seven days", () => {
  const { start, end } = periodRange("weekly", new Date("2026-08-18T12:00:00Z")); assert.equal(start.getDay(), 1); assert.equal(Math.round((end.getTime() - start.getTime()) / 86400000), 7);
});
