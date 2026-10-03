import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("R2 helper does not import the AWS SDK", () => {
  const source = readFileSync(new URL("./r2.ts", import.meta.url), "utf8");
  assert.equal(/@aws-sdk\/client-s3/.test(source), false);
  assert.match(source, /signedR2Request/);
});
