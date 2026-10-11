import { test } from "node:test";
import assert from "node:assert/strict";
import { chatPatch, displayFact, validFact } from "../src/lib/ai/chat.ts";

test("chat maps only explicit validated fields and leaves unrelated answers intact", () => {
  const previous = { baerende: "usikker", apning_bredde: null, etasjer_over: null, etasje: "usikker" };
  const patch = chatPatch("vegg", [{ key: "apning_bredde", value: 2, evidence: "2 meter" }, { key: "approved", value: "yes", evidence: "yes" }]);
  assert.deepEqual({ ...previous, ...patch }, { ...previous, apning_bredde: 2 });
});
test("unknown correction clears earlier measurement without defaulting floors", () => {
  assert.deepEqual(chatPatch("vegg", [{ key: "etasjer_over", value: null, evidence: "vet ikke" }]), { etasjer_over: null });
});
test("basement measurements retain required units and never confirm approved drawings", () => {
  const patch = chatPatch("kjeller", [{ key: "takhoyde", value: 2300, evidence: "2,3 meter" }, { key: "room", value: "bod", evidence: "godkjent bod" }, { key: "godkjent_bruk_bekreftet", value: "true", evidence: "godkjent" }]);
  assert.deepEqual(patch, { takhoyde: 2300, room: "bod", godkjent_bruk_bekreftet: false, unknownMeasurements: false });
  assert.equal(displayFact("kjeller", { key: "takhoyde", value: 2300, evidence: "2,3 meter" }), "2300 mm");
});
test("numeric strings, nonfinite numbers, invalid enums and missing evidence are rejected", () => {
  for (const fact of [{ key: "etasjer_over", value: 1.5, evidence: "1.5" }, { key: "apning_bredde", value: "2", evidence: "2" }, { key: "apning_bredde", value: Infinity, evidence: "x" }, { key: "baerende", value: "maybe", evidence: "maybe" }, { key: "baerende", value: "nei", evidence: "" }]) assert.equal(validFact("vegg", fact), false);
});
