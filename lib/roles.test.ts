import assert from "node:assert/strict";
import { test } from "node:test";
import { isBootstrapAdmin, shouldSkipAdminOtp } from "./roles";

test("bootstrap admin email bypasses OTP only for the configured account", () => {
  assert.equal(isBootstrapAdmin("modestwilton@gmail.com"), true);
  assert.equal(isBootstrapAdmin("other-admin@example.com"), false);
  assert.equal(shouldSkipAdminOtp({ email: "modestwilton@gmail.com" }), true);
  assert.equal(shouldSkipAdminOtp({ email: "other-admin@example.com" }), false);
});
