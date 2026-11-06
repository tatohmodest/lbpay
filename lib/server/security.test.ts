import { test } from "node:test";
import assert from "node:assert/strict";
import { withLedgerLock } from "./ledger-lock";
import { serialByKey } from "./serial";
import { railKindOf } from "./rail-kind";
import { pinLockDuration } from "./pin";
import { amountIssue } from "../limits";
import { isChunkError } from "../chunk-reload";

test("ledger lock is re-entrant and still serializes outside callers", async () => {
  const order: string[] = [];
  const a = withLedgerLock(async () => {
    order.push("a-start");
    await withLedgerLock(async () => order.push("a-inner"));
    await new Promise((r) => setTimeout(r, 5));
    order.push("a-end");
  });
  const b = withLedgerLock(async () => order.push("b"));
  await Promise.all([a, b]);
  assert.deepEqual(order, ["a-start", "a-inner", "a-end", "b"]);
});

test("parallel guesses on one key run one at a time", async () => {
  let fails = 0;
  const seen: number[] = [];
  await Promise.all(
    Array.from({ length: 10 }, () =>
      serialByKey("pin:usr_1", async () => {
        seen.push(fails);
        await new Promise((r) => setTimeout(r, 1));
        fails += 1;
      }),
    ),
  );
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("payouts are only ever checked as payouts", () => {
  assert.equal(railKindOf({ kind: "withdraw" }), "disburse");
  assert.equal(railKindOf({ kind: "payout" }), "disburse");
  assert.equal(railKindOf({ kind: "deposit" }), "collect");
  assert.equal(railKindOf({ kind: "cross_network" }), null);
});

test("PIN locks grow so 10,000 PINs can't be tried in days", () => {
  assert.equal(pinLockDuration(0), 60_000);
  assert.equal(pinLockDuration(1), 5 * 60_000);
  assert.equal(pinLockDuration(10), 24 * 60 * 60 * 1000);
});

test("amounts must be whole, finite XAF", () => {
  assert.notEqual(amountIssue(Infinity, "wallet"), "");
  assert.notEqual(amountIssue(150.5, "wallet"), "");
  assert.equal(amountIssue(150, "wallet"), "");
});

test("chunk load failures are recognised", () => {
  assert.ok(isChunkError(new Error("Failed to load chunk /_next/static/chunks/19w54hsd5ogiu.js")));
  assert.ok(isChunkError(Object.assign(new Error("x"), { name: "ChunkLoadError" })));
  assert.ok(!isChunkError(new Error("Insufficient wallet balance")));
});
