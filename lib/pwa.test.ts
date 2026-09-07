import assert from "node:assert/strict";
import { test } from "node:test";
import { platformFromUserAgent } from "./pwa";

test("platformFromUserAgent detects Android, iPhone, and desktop", () => {
  assert.equal(
    platformFromUserAgent(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36",
    ),
    "android",
  );
  assert.equal(
    platformFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"),
    "ios",
  );
  assert.equal(platformFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0"), "desktop");
});
