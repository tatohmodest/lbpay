import test from "node:test";
import assert from "node:assert/strict";
import { summarize, gatewayCostOf } from "./admin-analytics";

const now = new Date("2026-10-27T12:00:00Z");
const at = "2026-10-27T10:00:00Z";
const tx = (kind: string, amount: number, fee = 0, extra: Record<string, unknown> = {}) =>
  ({ id: `${kind}${amount}`, userId: "u1", kind, amount, fee, status: "success", method: "mtn", counterparty: "", createdAt: at, ...extra }) as never;

test("volume, LBPay income and PayUnit cost add up", () => {
  const s = summarize(
    [
      tx("deposit", 10_000, 153), // customer paid 10,153 via MTN
      tx("withdraw", 10_000, 250), // 10,000 sent to MTN
      tx("send", 5_000, 0, { method: "wallet" }),
      tx("receive", 5_000, 0, { method: "wallet", userId: "u2" }), // mirror, not counted
      tx("penalty", 300),
      tx("withdraw", 9_000, 225, { status: "failed" }),
    ],
    "all",
    now,
  );
  assert.equal(s.gtv, 25_000);
  assert.equal(s.feeRevenue, 403);
  assert.equal(s.otherIncome, 300);
  assert.equal(s.lbpayRevenue, 703);
  assert.equal(s.gatewayCost, Math.round(10_153 * 0.015) + 150);
  assert.equal(s.netMargin, 703 - s.gatewayCost);
  assert.equal(s.railVolume, 20_000);
  assert.equal(s.walletVolume, 5_000);
  assert.equal(s.failed, 1);
  assert.equal(s.byKind.find((k) => k.kind === "receive"), undefined);
});

test("a quick MoMo-to-MoMo transfer pays the gateway twice", () => {
  assert.equal(gatewayCostOf({ kind: "cross_network", amount: 10_000, fee: 350 }), Math.round(10_350 * 0.015 + 10_000 * 0.015));
  assert.equal(gatewayCostOf({ kind: "send", amount: 10_000, fee: 0 }), 0);
});

test("periods cut by time", () => {
  const old = tx("deposit", 1_000, 15, { createdAt: "2026-08-01T10:00:00Z" });
  assert.equal(summarize([old], "30d", now).gtv, 0);
  assert.equal(summarize([old], "all", now).gtv, 1_000);
});
