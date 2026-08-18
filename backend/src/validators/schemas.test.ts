import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, taskCreateSchema, taskProgressSchema, taskUpdateSchema, targetUpdateSchema } from "./schemas.js";
const id = "507f1f77bcf86cd799439011";
test("login validation rejects malformed credentials", () => {
  assert.equal(loginSchema.safeParse({ body: { email: "not-an-email", password: "short" } }).success, false);
  assert.equal(loginSchema.safeParse({ body: { email: "person@9tangle.com", password: "strong-pass" } }).success, true);
});
test("task create validates date order and output target", () => {
  const base = { title: "Research products", description: "", taskType: "Product Research", assignedTo: id, priority: "high", startDate: "2026-08-18T09:00:00.000Z", dueDate: "2026-08-18T17:00:00.000Z", targetQuantity: 30, estimatedHours: 8, instructions: "" };
  assert.equal(taskCreateSchema.safeParse({ body: base }).success, true);
  assert.equal(taskCreateSchema.safeParse({ body: { ...base, dueDate: "2026-08-17T17:00:00.000Z" } }).success, false);
  assert.equal(taskCreateSchema.safeParse({ body: { ...base, targetQuantity: -2 } }).success, false);
});
test("partial update schemas load and accept focused edits", () => {
  assert.equal(taskUpdateSchema.safeParse({ params: { id }, body: { priority: "urgent" } }).success, true);
  assert.equal(targetUpdateSchema.safeParse({ params: { id }, body: { completedQuantity: 12 } }).success, true);
});
test("progress validation prevents negative values", () => {
  assert.equal(taskProgressSchema.safeParse({ params: { id }, body: { quantity: -1 } }).success, false);
  assert.equal(taskProgressSchema.safeParse({ params: { id }, body: { quantity: 10, note: "Done" } }).success, true);
});
