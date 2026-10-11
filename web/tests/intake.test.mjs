import { test } from "node:test";
import assert from "node:assert/strict";
import { activeFields, applyIntakeUpdates, missingFields, validIntakeValue } from "../src/lib/ai/intake.ts";

const number = { key: "area", type: "number", nullable: false, choices: [], min: 0, max: null, exclusiveMin: true, minLength: 1, maxLength: 2000 };
const bool = { ...number, key: "sleeping", type: "boolean" };
test("unanswered required booleans are not silently treated as no", () => {
  assert.equal(missingFields([bool], {}).length, 1);
  assert.equal(missingFields([bool], { sleeping: false }).length, 0);
  assert.equal(missingFields([{ ...bool, nullable: true }], {}).length, 0);
});
test("unknown corrections clear facts without creating a valid required answer", () => {
  const answers = applyIntakeUpdates([number], { area: 20 }, [{ key: "area", value: null, evidence: "I do not know" }]);
  assert.equal(answers.area, null);
  assert.equal(missingFields([number], answers).length, 1);
});
test("AI cannot write manual confirmations, foreign keys or invalid numbers", () => {
  const fields = [number, { ...bool, key: "godkjent_bruk_bekreftet", manual: true }];
  const updates = [{ key: "area", value: -4, evidence: "4" }, { key: "godkjent_bruk_bekreftet", value: true, evidence: "yes" }, { key: "approved", value: true, evidence: "yes" }];
  assert.deepEqual(applyIntakeUpdates(fields, {}, updates), {});
  assert.equal(validIntakeValue(number, Infinity), false);
  assert.equal(validIntakeValue({ ...number, type: "integer" }, 1.5), false);
});
test("conditional fields appear only for the applicable project branch", () => {
  const field = { ...number, when: { key: "type", values: ["terrasse"] } };
  assert.equal(activeFields([field], { type: "farge" }).length, 0);
  assert.equal(missingFields([field], { type: "terrasse" }).length, 1);
});
test("a change of approved use invalidates the drawing confirmation", () => {
  const field = { ...number, key: "room", type: "string", choices: [{ value: "bod" }, { value: "usikker" }] };
  assert.equal(applyIntakeUpdates([field], { room: "bod", godkjent_bruk_bekreftet: true }, [{ key: "room", value: "usikker", evidence: "unknown" }]).godkjent_bruk_bekreftet, false);
});
