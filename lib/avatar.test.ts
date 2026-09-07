import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_AVATAR, isDefaultAvatar, nameInitials, resolveAvatar } from "./avatar";

test("empty and old gendered portraits resolve to the wallet illustration", () => {
  assert.equal(DEFAULT_AVATAR, "/illustrations/empty-wallet.webp");
  assert.equal(resolveAvatar(""), DEFAULT_AVATAR);
  assert.equal(resolveAvatar(null), DEFAULT_AVATAR);
  assert.equal(resolveAvatar("/illustrations/empty-wallet.webp"), DEFAULT_AVATAR);
  assert.equal(resolveAvatar("/illustrations/avatar-modest.webp"), DEFAULT_AVATAR);
  assert.equal(isDefaultAvatar("/illustrations/avatar-modest.webp"), true);
});

test("a real photo is left alone", () => {
  assert.equal(resolveAvatar("/uploads/me.jpg"), "/uploads/me.jpg");
  assert.equal(resolveAvatar("/illustrations/portrait-aisha.webp"), "/illustrations/portrait-aisha.webp");
  assert.equal(isDefaultAvatar("/illustrations/portrait-aisha.webp"), false);
});

test("nameInitials uses the first and last word", () => {
  assert.equal(nameInitials("Amina Tchoungui"), "AT");
  assert.equal(nameInitials("Jean"), "JE");
  assert.equal(nameInitials("  mira  n.  "), "MN");
  assert.equal(nameInitials(""), "U");
  assert.equal(nameInitials(null), "U");
});
