import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CHECKOUT_METHODS,
  PAYOUT_DESTINATIONS,
  checkoutFeeBadge,
  checkoutMethodFee,
  payoutDestinationFee,
  payoutFeeBadge,
} from "./checkout-methods";

test("checkout lists LBPay wallet first", () => {
  assert.equal(CHECKOUT_METHODS[0]?.id, "wallet");
  assert.equal(CHECKOUT_METHODS[0]?.label, "LBPay wallet");
});

test("wallet checkout has no fee and others take 1.5 percent", () => {
  assert.equal(checkoutMethodFee(10_000, "wallet"), 0);
  assert.equal(checkoutMethodFee(10_000, "mtn"), 150);
  assert.equal(checkoutMethodFee(10_000, "orange"), 150);
  assert.equal(checkoutFeeBadge("wallet"), "No fee");
  assert.equal(checkoutFeeBadge("mtn"), "Charge 1.5%");
});

test("payout destinations list LBPay wallet first and mark it free", () => {
  assert.equal(PAYOUT_DESTINATIONS[0]?.id, "wallet");
  assert.equal(payoutDestinationFee(10_000, "wallet"), 0);
  assert.equal(payoutDestinationFee(10_000, "mtn"), 250);
  assert.equal(payoutFeeBadge("wallet"), "No fee");
  assert.equal(payoutFeeBadge("orange"), "Charge 2.5%");
});
