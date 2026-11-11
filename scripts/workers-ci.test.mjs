import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { isWorkersCI } from "./workers-ci.mjs";

test("Workers CI detection treats dashboard and injected vars as CI", () => {
  assert.equal(isWorkersCI({}), false);
  assert.equal(isWorkersCI({ WORKERS_CI: "1" }), true);
  assert.equal(isWorkersCI({ WORKERS_CI: "true" }), true);
  assert.equal(isWorkersCI({ WORKERS_CI: "0" }), false);
  assert.equal(isWorkersCI({ WORKERS_CI_COMMIT_SHA: "abc" }), true);
  assert.equal(isWorkersCI({ WORKERS_CI_BUILD_UUID: "uuid" }), true);
  assert.equal(isWorkersCI({ CI: "true" }), false);
});

test("wrangler shim is idempotent and keeps the shebang", () => {
  const root = mkdtempSync(path.join(tmpdir(), "lbpay-wrangler-shim-"));
  const bin = path.join(root, "node_modules/wrangler/bin/wrangler.js");
  mkdirSync(path.dirname(bin), { recursive: true });
  writeFileSync(bin, "#!/usr/bin/env node\nconst ok = true;\n");
  try {
    const run = () =>
      spawnSync(process.execPath, [path.join(process.cwd(), "scripts/shim-wrangler-direct-deploy.mjs")], {
        cwd: root,
        encoding: "utf8",
      });
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const once = readFileSync(bin, "utf8");
    assert.match(once, /^#!\/usr\/bin\/env node\n/);
    assert.match(once, /LBPAY_OPEN_NEXT_DEPLOY_SHIM/);
    assert.match(once, /OPEN_NEXT_DEPLOY/);
    assert.match(once, /const ok = true;/);
    const second = run();
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(bin, "utf8"), once);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

