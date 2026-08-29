import assert from "node:assert/strict";
import { test } from "node:test";
import { applyRailSettlement } from "./settle-rail";

test("a successful deposit credits the wallet only once", () => {
  const tx = { status: "pending" as const, kind: "deposit", amount: 1000, fee: 20, meta: {} };
  const wallet = { balance: 500 };
  const first = applyRailSettlement(tx, wallet, "success");
  const second = applyRailSettlement(tx, wallet, "success");
  assert.equal(first.credited, true);
  assert.equal(second.noop, true);
  assert.equal(second.credited, false);
  assert.equal(wallet.balance, 1500);
  assert.equal(tx.status, "success");
  assert.equal(tx.meta?.creditApplied, true);
});

test("a deposit that was already credited at collect time is not credited again", () => {
  const tx = {
    status: "pending" as const,
    kind: "deposit",
    amount: 1000,
    meta: { creditApplied: true },
  };
  const wallet = { balance: 1500 };
  const result = applyRailSettlement(tx, wallet, "success");
  assert.equal(result.credited, false);
  assert.equal(wallet.balance, 1500);
  assert.equal(tx.status, "success");
});

test("a failed pending withdrawal refunds once", () => {
  const tx = { status: "pending" as const, kind: "withdraw", amount: 1000, fee: 30, meta: {} };
  const wallet = { balance: 0 };
  const first = applyRailSettlement(tx, wallet, "failed");
  const second = applyRailSettlement(tx, wallet, "failed");
  assert.equal(first.refunded, true);
  assert.equal(second.noop, true);
  assert.equal(wallet.balance, 1030);
});

test("pending rail status does not move money", () => {
  const tx = { status: "pending" as const, kind: "deposit", amount: 1000, meta: {} };
  const wallet = { balance: 0 };
  const result = applyRailSettlement(tx, wallet, "pending");
  assert.equal(result.noop, true);
  assert.equal(wallet.balance, 0);
  assert.equal(tx.status, "pending");
});
