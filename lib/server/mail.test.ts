import assert from "node:assert/strict";
import { test } from "node:test";
import { mailConfigured } from "./mail";

test("mailConfigured is false without SMTP or HTTP email keys", () => {
  assert.equal(mailConfigured(), false);
});
