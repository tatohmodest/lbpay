import { getDb, saveDb, type StoredSavingsPlan, type StoredTx } from "@/lib/server/db";
import { withLedgerLock } from "@/lib/server/ledger-lock";
import { uid } from "@/lib/format";
import {
  SAVINGS,
  applyDeposit,
  clampPenaltyRate,
  firstDueAt,
  settlePlan,
  validatePlanInput,
  type SavingsInput,
} from "@/lib/savings";
import type { SavingsPlan } from "@/lib/types";

async function emitPush(run: (mod: typeof import("./push")) => Promise<unknown>) {
  try {
    const mod = await import("./push");
    await run(mod);
  } catch (error) {
    console.error("[lbpay] push failed", error);
  }
}

export function publicPlan(plan: StoredSavingsPlan): SavingsPlan {
  const { userId: _userId, ...rest } = plan;
  void _userId;
  return rest;
}

function txBase(userId: string, plan: StoredSavingsPlan, now: string): Omit<StoredTx, "kind" | "amount" | "note"> {
  return {
    id: uid("TXN"),
    userId,
    fee: 0,
    status: "success",
    method: "wallet",
    counterparty: `${plan.emoji} ${plan.name}`,
    createdAt: now,
    rail: "internal",
    meta: { planId: plan.id, planName: plan.name },
  };
}

/**
 * Catch up every due cycle for a user's plans: auto-saves pull from the wallet,
 * missed cycles cut the configured penalty from the wallet (or the pot as a fallback).
 * Runs lazily whenever the wallet or savings are loaded.
 */
export async function settleSavings(userId: string) {
  return withLedgerLock(async () => {
    const db = await getDb();
    const wallet = db.wallets.find((w) => w.userId === userId);
    if (!wallet) return;
    const plans = (db.savings || []).filter((p) => p.userId === userId && p.status === "active");
    if (!plans.length) return;
    const nowDate = new Date();
    const now = nowDate.toISOString();
    let changed = false;
    const pushes: StoredTx[] = [];
    for (const plan of plans) {
      const result = settlePlan(plan, wallet.balance, nowDate);
      if (!result.moves.length) continue;
      changed = true;
      for (const move of result.moves) {
        if (move.type === "auto_save") {
          wallet.balance -= move.amount;
          db.transactions.unshift({
            ...txBase(userId, plan, now),
            kind: "savings_in",
            amount: move.amount,
            note: `Auto-save · cycle due ${move.dueAt.slice(0, 10)}`,
          });
        } else if (move.type === "penalty_wallet" || move.type === "penalty_pot") {
          if (move.type === "penalty_wallet") wallet.balance -= move.amount;
          const tx: StoredTx = {
            ...txBase(userId, plan, now),
            kind: "penalty",
            amount: move.amount,
            note:
              move.type === "penalty_wallet"
                ? `Missed ${plan.frequency} save due ${move.dueAt.slice(0, 10)} · ${Math.round(plan.penaltyRate * 100)}% cut from wallet`
                : `Missed ${plan.frequency} save due ${move.dueAt.slice(0, 10)} · ${Math.round(plan.penaltyRate * 100)}% cut from the pot`,
          };
          db.transactions.unshift(tx);
          pushes.push(tx);
        }
      }
      Object.assign(plan, result.plan, { userId });
    }
    if (changed) {
      await saveDb(db);
      for (const tx of pushes.slice(0, 3)) await emitPush((mod) => mod.pushForTransaction(tx));
    }
  });
}

export async function listSavings(userId: string) {
  await settleSavings(userId);
  const db = await getDb();
  return (db.savings || [])
    .filter((p) => p.userId === userId)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return +new Date(a.nextDueAt) - +new Date(b.nextDueAt);
    })
    .map(publicPlan);
}

export async function findPlan(userId: string, id: string) {
  const db = await getDb();
  return (db.savings || []).find((p) => p.userId === userId && p.id === id) || null;
}

export async function createSavingsPlan(userId: string, input: SavingsInput) {
  const issue = validatePlanInput(input);
  if (issue) throw new Error(issue);
  return withLedgerLock(async () => {
    const db = await getDb();
    const mine = (db.savings || []).filter((p) => p.userId === userId && p.status === "active");
    if (mine.length >= SAVINGS.maxActivePlans) throw new Error(`You can run up to ${SAVINGS.maxActivePlans} plans at once.`);
    const now = new Date();
    const plan: StoredSavingsPlan = {
      id: uid("SAV"),
      userId,
      name: input.name.trim(),
      emoji: (input.emoji || "🎯").slice(0, 4),
      frequency: input.frequency,
      amount: Math.round(input.amount),
      target: input.target ? Math.round(input.target) : null,
      penaltyRate: clampPenaltyRate(input.penaltyRate ?? SAVINGS.defaultPenaltyRate),
      autoSave: Boolean(input.autoSave),
      balance: 0,
      saved: 0,
      penalties: 0,
      streak: 0,
      bestStreak: 0,
      missed: 0,
      nextDueAt: firstDueAt(input.frequency, now),
      status: "active",
      createdAt: now.toISOString(),
    };
    db.savings = [...(db.savings || []), plan];
    await saveDb(db);
    return publicPlan(plan);
  });
}

export async function depositToPlan(userId: string, planId: string, amount: number) {
  if (!Number.isInteger(amount) || amount < SAVINGS.minAmount) throw new Error(`Save at least ${SAVINGS.minAmount} XAF.`);
  return withLedgerLock(async () => {
    const db = await getDb();
    const plan = (db.savings || []).find((p) => p.userId === userId && p.id === planId);
    if (!plan) throw new Error("Savings plan not found.");
    if (plan.status !== "active") throw new Error("This plan is no longer active.");
    const wallet = db.wallets.find((w) => w.userId === userId);
    if (!wallet) throw new Error("Wallet missing");
    if (wallet.balance < amount) throw new Error("Insufficient wallet balance");
    wallet.balance -= amount;
    const now = new Date();
    Object.assign(plan, applyDeposit(plan, amount, now), { userId });
    const tx: StoredTx = {
      ...txBase(userId, plan, now.toISOString()),
      kind: "savings_in",
      amount,
      note: amount >= plan.amount ? `Saved · streak ${plan.streak}` : "Top-up (below the cycle amount)",
    };
    db.transactions.unshift(tx);
    await saveDb(db);
    return { plan: publicPlan(plan), tx, balance: wallet.balance };
  });
}

export async function withdrawFromPlan(userId: string, planId: string, amount: number | "all", close = false) {
  return withLedgerLock(async () => {
    const db = await getDb();
    const plan = (db.savings || []).find((p) => p.userId === userId && p.id === planId);
    if (!plan) throw new Error("Savings plan not found.");
    if (plan.status === "closed") throw new Error("This plan is already closed.");
    const wallet = db.wallets.find((w) => w.userId === userId);
    if (!wallet) throw new Error("Wallet missing");
    const value = amount === "all" ? plan.balance : Math.round(amount);
    if (value < 0 || (value === 0 && !close)) throw new Error("Enter an amount to move back.");
    if (value > plan.balance) throw new Error("That is more than the pot holds.");
    const now = new Date().toISOString();
    if (value > 0) {
      wallet.balance += value;
      plan.balance -= value;
      db.transactions.unshift({
        ...txBase(userId, plan, now),
        kind: "savings_out",
        amount: value,
        note: close ? "Plan closed · pot moved to wallet" : "Moved back to wallet",
      });
    }
    if (close || plan.balance === 0) {
      plan.status = "closed";
      plan.closedAt = now;
    }
    await saveDb(db);
    return { plan: publicPlan(plan), balance: wallet.balance };
  });
}

export async function updatePlanSettings(
  userId: string,
  planId: string,
  patch: Partial<Pick<SavingsPlan, "autoSave" | "penaltyRate" | "name" | "emoji" | "target">>,
) {
  return withLedgerLock(async () => {
    const db = await getDb();
    const plan = (db.savings || []).find((p) => p.userId === userId && p.id === planId);
    if (!plan) throw new Error("Savings plan not found.");
    if (plan.status !== "active") throw new Error("This plan is no longer active.");
    if (patch.autoSave != null) plan.autoSave = Boolean(patch.autoSave);
    if (patch.penaltyRate != null) plan.penaltyRate = clampPenaltyRate(Number(patch.penaltyRate));
    if (patch.name != null) {
      const name = String(patch.name).trim();
      if (name.length < 2 || name.length > 40) throw new Error("Plan name must be 2 to 40 characters.");
      plan.name = name;
    }
    if (patch.emoji) plan.emoji = String(patch.emoji).slice(0, 4);
    if (patch.target !== undefined) {
      const target = patch.target ? Math.round(Number(patch.target)) : null;
      if (target !== null && target < plan.amount) throw new Error("The goal must be at least one cycle amount.");
      plan.target = target;
      if (target && plan.balance >= target) plan.status = "completed";
    }
    await saveDb(db);
    return publicPlan(plan);
  });
}
