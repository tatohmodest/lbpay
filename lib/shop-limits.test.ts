import assert from "node:assert/strict";
import { test } from "node:test";
import { SHOP_LIMITS, shopSlotLimit, shopSlotState } from "./shop-limits";

test("shop starts at 20 product slots", () => {
  assert.equal(shopSlotLimit(0), 20);
  assert.equal(SHOP_LIMITS.packPrice, 2000);
  assert.equal(SHOP_LIMITS.packSize, 10);
});

test("each extra pack adds 10 slots", () => {
  assert.equal(shopSlotLimit(1), 30);
  assert.equal(shopSlotLimit(2), 40);
});

test("shopSlotState flags the cap without mentioning the paid pack", () => {
  const open = shopSlotState(3, 0);
  assert.equal(open.used, 3);
  assert.equal(open.limit, 20);
  assert.equal(open.atLimit, false);
  const full = shopSlotState(20, 0);
  assert.equal(full.atLimit, true);
  assert.equal(full.remaining, 0);
});
