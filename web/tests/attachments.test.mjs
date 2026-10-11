import { test } from "node:test";
import assert from "node:assert/strict";
import { attachmentError } from "../src/lib/ai/attachments.ts";

test("attachment limits reject unsupported, empty, excessive and oversized files", () => {
  const mb = 1024 * 1024;
  assert.equal(attachmentError([{ name: "plan.PDF", size: 10 * mb }, { name: "photo.jpeg", size: 10 * mb }]), null);
  assert.equal(attachmentError([{ name: "plan.exe", size: 1 }]), "type");
  assert.equal(attachmentError([{ name: "plan.pdf", size: 0 }]), "size");
  assert.equal(attachmentError([{ name: "plan.pdf", size: 10 * mb + 1 }]), "size");
  assert.equal(attachmentError(Array.from({ length: 7 }, () => ({ name: "plan.pdf", size: 1 }))), "count");
  assert.equal(attachmentError(Array.from({ length: 3 }, () => ({ name: "plan.pdf", size: 8 * mb }))), "total");
});
