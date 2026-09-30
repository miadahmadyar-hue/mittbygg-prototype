import { test } from "node:test";
import assert from "node:assert/strict";
import { runAiReview } from "../src/lib/ai/review.ts";

const architect = { meta: { source: "claude" }, summary: "Check roof", items: [{ type: "missing", text: "Span unknown" }], anbefalinger: ["Measure span"] };
const engineer = { konklusjon: "Needs review", beregninger: [] };
const fallback = { architect: { meta: { source: "fallback" } }, engineer: { meta: { source: "fallback" } } };

test("engineer waits for architect and receives findings and recommendations", async () => {
  const order = [];
  const result = await runAiReview(async () => { order.push("architect"); return architect; }, async (context) => {
    order.push("engineer");
    assert.deepEqual(JSON.parse(context), { summary: architect.summary, items: architect.items, anbefalinger: architect.anbefalinger });
    return engineer;
  }, fallback, () => order.push("progress"));
  assert.deepEqual(order, ["architect", "progress", "engineer"]);
  assert.deepEqual(result, { architect, engineer });
});

test("architect failure still allows an independent engineer review", async () => {
  const result = await runAiReview(async () => { throw new Error("offline"); }, async (context) => {
    assert.match(context, /ikke tilgjengelig/);
    return engineer;
  }, fallback, () => {});
  assert.equal(result.architect, fallback.architect);
  assert.equal(result.engineer, engineer);
});

test("engineer failure preserves the successful architect review", async () => {
  const result = await runAiReview(async () => architect, async () => { throw new Error("timeout"); }, fallback, () => {});
  assert.equal(result.architect, architect);
  assert.equal(result.engineer, fallback.engineer);
});
