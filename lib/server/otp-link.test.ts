import { test } from "node:test";
import assert from "node:assert/strict";
import { openCode, sealCode } from "./otp-link";
import { isDisposableEmail } from "../disposable-email";

process.env.SESSION_SECRET ||= "test-secret";

test("a code link opens to the same code and hides the digits", () => {
  const token = sealCode("482913", "verify", Date.now() + 60_000);
  assert.ok(!token.includes("482913"));
  assert.deepEqual(openCode(token)?.code, "482913");
  assert.equal(openCode(token)?.purpose, "verify");
});

test("expired or tampered links open nothing", () => {
  assert.equal(openCode(sealCode("111111", "reset", Date.now() - 1)), null);
  const token = sealCode("222222", "pin", Date.now() + 60_000);
  const flipped = token.slice(0, -2) + (token.endsWith("A") ? "BB" : "AA");
  assert.equal(openCode(flipped), null);
  assert.equal(openCode("not-a-token"), null);
});

test("throwaway inboxes are refused, real ones are not", () => {
  assert.ok(isDisposableEmail("x@mailinator.com"));
  assert.ok(isDisposableEmail("x@abc.yopmail.com"));
  assert.ok(!isDisposableEmail("amina@gmail.com"));
  assert.ok(!isDisposableEmail("ops@loopingbinary.com"));
});
