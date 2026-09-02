import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeSupportBody, supportBodyIssue, supportPreview, unreadSupportCount } from "./support";
import { isSafeNextPath } from "./auth-next";

test("support messages are trimmed and capped", () => {
  assert.equal(sanitizeSupportBody("  hello   there  "), "hello there");
  assert.equal(supportBodyIssue(""), "Write a message.");
  assert.equal(supportBodyIssue("ok"), "");
  assert.match(supportBodyIssue("x".repeat(2001)), /2000/);
});

test("unread counts only the other party's later messages", () => {
  const messages = [
    { author: "user" as const, createdAt: "2026-01-01T10:00:00.000Z" },
    { author: "admin" as const, createdAt: "2026-01-01T11:00:00.000Z" },
    { author: "admin" as const, createdAt: "2026-01-01T12:00:00.000Z" },
  ];
  assert.equal(unreadSupportCount(messages, "2026-01-01T10:30:00.000Z", "admin"), 2);
  assert.equal(unreadSupportCount(messages, "2026-01-01T12:00:00.000Z", "admin"), 0);
  assert.equal(unreadSupportCount(messages, undefined, "user"), 1);
});

test("support preview shortens long copy", () => {
  assert.equal(supportPreview("Short"), "Short");
  assert.ok(supportPreview("n".repeat(120), 20).endsWith("..."));
});

test("auth next paths stay on this site", () => {
  assert.equal(isSafeNextPath("/pay/red-oil"), true);
  assert.equal(isSafeNextPath("https://evil.example"), false);
  assert.equal(isSafeNextPath("//evil.example"), false);
});
