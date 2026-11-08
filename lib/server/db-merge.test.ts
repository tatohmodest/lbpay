import { test } from "node:test";
import assert from "node:assert/strict";
import { keepNewerUntouched, type DbShape } from "./db";

const shape = (balance: number, status: "pending" | "success") =>
  ({
    users: [],
    wallets: [{ userId: "u1", balance }],
    transactions: [{ id: "t1", userId: "u1", kind: "withdraw", amount: 1000, fee: 0, status, method: "mtn", counterparty: "x", createdAt: "2026-11-08" }],
  }) as unknown as DbShape;

test("an unrelated save can't put back an old balance or un-settle a payout", () => {
  const origin = shape(5000, "pending"); // what the request read
  const base = shape(4000, "success"); // what another save wrote meanwhile
  const db = shape(5000, "pending"); // the request changed neither
  const out = keepNewerUntouched(db, origin, base);
  assert.equal(out.wallets[0].balance, 4000);
  assert.equal(out.transactions[0].status, "success");
});

test("a save keeps its own real changes", () => {
  const origin = shape(5000, "pending");
  const base = shape(4000, "pending");
  const db = shape(6000, "success");
  const out = keepNewerUntouched(db, origin, base);
  assert.equal(out.wallets[0].balance, 6000);
  assert.equal(out.transactions[0].status, "success");
});
