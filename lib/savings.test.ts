import assert from "node:assert/strict";
import { test } from "node:test";
import type { SavingsPlan } from "./types";
import { SAVINGS, addCycle, applyDeposit, clampPenaltyRate, penaltyFor, settlePlan, validatePlanInput } from "./savings";

function plan(overrides: Partial<SavingsPlan> = {}): SavingsPlan {
  return {
    id: "sav_t",
    name: "Rent",
    emoji: "🏠",
    frequency: "daily",
    amount: 2_500,
    target: 75_000,
    penaltyRate: 0.05,
    autoSave: false,
    balance: 10_000,
    saved: 10_000,
    penalties: 0,
    streak: 4,
    bestStreak: 4,
    missed: 0,
    nextDueAt: "2026-09-05T23:00:00.000Z",
    status: "active",
    createdAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

test("addCycle steps daily, weekly and clamps month ends", () => {
  assert.equal(addCycle("2026-09-05T23:00:00.000Z", "daily"), "2026-09-06T23:00:00.000Z");
  assert.equal(addCycle("2026-09-05T23:00:00.000Z", "weekly"), "2026-09-12T23:00:00.000Z");
  assert.equal(addCycle("2026-01-31T23:00:00.000Z", "monthly"), "2026-02-28T23:00:00.000Z");
  assert.equal(addCycle("2026-02-28T23:00:00.000Z", "monthly"), "2026-03-28T23:00:00.000Z");
});

test("penalty is the configured share of the cycle amount, clamped to 1–10%", () => {
  assert.equal(penaltyFor({ amount: 2_500, penaltyRate: 0.05 }), 125);
  assert.equal(penaltyFor({ amount: 10_000, penaltyRate: 0.1 }), 1_000);
  assert.equal(clampPenaltyRate(0.5), SAVINGS.maxPenaltyRate);
  assert.equal(clampPenaltyRate(0), SAVINGS.minPenaltyRate);
  assert.equal(clampPenaltyRate(Number.NaN), SAVINGS.defaultPenaltyRate);
  assert.equal(clampPenaltyRate(0.037), 0.04);
});

test("settlePlan does nothing before the due date", () => {
  const p = plan();
  const out = settlePlan(p, 50_000, new Date("2026-09-05T12:00:00.000Z"));
  assert.deepEqual(out.moves, []);
  assert.equal(out.plan.nextDueAt, p.nextDueAt);
  assert.equal(out.plan.streak, 4);
});

test("a missed cycle cuts the penalty from the wallet and resets the streak", () => {
  const out = settlePlan(plan(), 50_000, new Date("2026-09-06T08:00:00.000Z"));
  assert.deepEqual(out.moves, [{ type: "penalty_wallet", amount: 125, dueAt: "2026-09-05T23:00:00.000Z" }]);
  assert.equal(out.plan.streak, 0);
  assert.equal(out.plan.missed, 1);
  assert.equal(out.plan.penalties, 125);
  assert.equal(out.plan.balance, 10_000);
  assert.equal(out.plan.nextDueAt, "2026-09-06T23:00:00.000Z");
});

test("when the wallet is empty the penalty comes out of the pot, and a broke pot misses for free", () => {
  const fromPot = settlePlan(plan(), 0, new Date("2026-09-06T08:00:00.000Z"));
  assert.equal(fromPot.moves[0].type, "penalty_pot");
  assert.equal(fromPot.plan.balance, 10_000 - 125);

  const free = settlePlan(plan({ balance: 50, saved: 50 }), 0, new Date("2026-09-06T08:00:00.000Z"));
  assert.equal(free.moves[0].type, "missed_free");
  assert.equal(free.plan.balance, 50);
  assert.equal(free.plan.missed, 1);
});

test("auto-save pulls the cycle amount when the wallet can cover it and extends the streak", () => {
  const out = settlePlan(plan({ autoSave: true }), 5_000, new Date("2026-09-07T08:00:00.000Z"));
  // Two cycles are due (5th and 6th). First is covered, second is not (wallet left 2 500 → penalty 125 fits).
  assert.deepEqual(
    out.moves.map((m) => m.type),
    ["auto_save", "auto_save"],
  );
  assert.equal(out.plan.balance, 15_000);
  assert.equal(out.plan.streak, 6);
  assert.equal(out.plan.bestStreak, 6);
  assert.equal(out.plan.nextDueAt, "2026-09-07T23:00:00.000Z");
});

test("catch-up never charges more than the cap of missed cycles", () => {
  const out = settlePlan(plan(), 1_000_000, new Date("2026-10-05T08:00:00.000Z"));
  const charged = out.moves.filter((m) => m.type === "penalty_wallet");
  const free = out.moves.filter((m) => m.type === "missed_free");
  assert.equal(charged.length, SAVINGS.maxPenaltiesPerSettle);
  assert.equal(out.moves.length, 30);
  assert.equal(free.length, 30 - SAVINGS.maxPenaltiesPerSettle);
  assert.equal(out.plan.penalties, SAVINGS.maxPenaltiesPerSettle * 125);
  assert.equal(out.plan.missed, 30);
});

test("reaching the goal through auto-save completes the plan", () => {
  const out = settlePlan(plan({ autoSave: true, balance: 72_500, saved: 72_500 }), 100_000, new Date("2026-09-09T08:00:00.000Z"));
  assert.equal(out.plan.status, "completed");
  assert.equal(out.plan.balance, 75_000);
  assert.equal(out.moves.length, 1);
});

test("closed plans are left alone", () => {
  const out = settlePlan(plan({ status: "closed" }), 50_000, new Date("2026-12-01T00:00:00.000Z"));
  assert.deepEqual(out.moves, []);
});

test("applyDeposit of at least the cycle amount clears the cycle; smaller top-ups only add to the pot", () => {
  const now = new Date("2026-09-05T10:00:00.000Z");
  const full = applyDeposit(plan(), 2_500, now);
  assert.equal(full.balance, 12_500);
  assert.equal(full.streak, 5);
  assert.equal(full.nextDueAt, "2026-09-06T23:00:00.000Z");
  assert.equal(full.lastDepositAt, now.toISOString());

  const partial = applyDeposit(plan(), 1_000, now);
  assert.equal(partial.balance, 11_000);
  assert.equal(partial.streak, 4);
  assert.equal(partial.nextDueAt, "2026-09-05T23:00:00.000Z");

  const done = applyDeposit(plan({ balance: 74_000, saved: 74_000 }), 2_500, now);
  assert.equal(done.status, "completed");
});

test("validatePlanInput rejects bad names, amounts, goals and penalty rates", () => {
  const ok = { name: "Rent", emoji: "🏠", frequency: "daily" as const, amount: 500, target: 15_000, penaltyRate: 0.05, autoSave: true };
  assert.equal(validatePlanInput(ok), "");
  assert.ok(validatePlanInput({ ...ok, name: "" }));
  assert.ok(validatePlanInput({ ...ok, amount: SAVINGS.minAmount - 1 }));
  assert.ok(validatePlanInput({ ...ok, target: 400 }));
  assert.ok(validatePlanInput({ ...ok, penaltyRate: 0.5 }));
});
