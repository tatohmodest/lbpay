import { test } from "node:test";
import assert from "node:assert/strict";
import { keepNewerUntouched, type DbShape } from "./db";
import { mergeTransactions, withoutDeletedUsers } from "./ledger-merge";

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

test("deleted transaction tombstones prevent older ledger snapshots from restoring a row", () => {
  const old = [{ id: "t1", amount: 100 }, { id: "t2", amount: 200 }];
  const current = [{ id: "t2", amount: 200 }, { id: "t3", amount: 300 }];
  assert.deepEqual(mergeTransactions(old, current, ["t1"]), [
    { id: "t2", amount: 200 },
    { id: "t3", amount: 300 },
  ]);
});

test("deleted user tombstones prevent stale account data from being merged back", () => {
  const rows = [
    { id: "wallet-1", userId: "deleted-user", balance: 500 },
    { id: "wallet-2", userId: "active-user", balance: 100 },
  ];
  assert.deepEqual(withoutDeletedUsers(rows, ["deleted-user"]), [
    { id: "wallet-2", userId: "active-user", balance: 100 },
  ]);
});
