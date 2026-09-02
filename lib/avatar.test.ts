import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_AVATAR, resolveAvatar } from "./avatar";

test("empty and wallet placeholders resolve to the default portrait", () => {
  assert.equal(resolveAvatar(""), DEFAULT_AVATAR);
  assert.equal(resolveAvatar(null), DEFAULT_AVATAR);
  assert.equal(resolveAvatar("/illustrations/empty-wallet.webp"), DEFAULT_AVATAR);
});

test("a real photo is left alone", () => {
  assert.equal(resolveAvatar("/uploads/me.jpg"), "/uploads/me.jpg");
  assert.equal(resolveAvatar("/illustrations/portrait-aisha.webp"), "/illustrations/portrait-aisha.webp");
});
