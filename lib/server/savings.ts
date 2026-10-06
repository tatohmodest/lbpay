import { getDb, saveDb, type StoredSavingsPlan, type StoredTx } from "@/lib/server/db";
import { withLedgerLock } from "@/lib/server/ledger-lock";
import { uid } from "@/lib/format";
import {
  SAVINGS,
  applyDeposit,
  clampPenaltyRate,
  earlyWithdrawalPenalty,
  firstDueAt,
  isObjectiveMet,
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
    counterparty: plan.name,
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
    const icon = input.icon || "target";
    const plan: StoredSavingsPlan = {
      id: uid("SAV"),
      userId,
      name: input.name.trim(),
      emoji: input.emoji || "🎯",
      icon,
      frequency: input.frequency,
      amount: Math.round(input.amount),
      target: input.target ? Math.round(input.target) : null,
      targetDate: input.targetDate || undefined,
      durationCycles: input.durationCycles ? Math.round(input.durationCycles) : undefined,
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
      points: 25, // Welcome bonus points for starting a pot!
      prepaidCycles: 0,
    };
    db.savings = [...(db.savings || []), plan];
    await saveDb(db);

    // Duolingo-style welcome nudge push
    await emitPush((mod) =>
      mod.sendPushToUser(userId, {
        title: `🎯 New Pot Created: ${plan.name}`,
        body: `Welcome to the discipline journey! +25 Saver Points earned. Your first save is due soon.`,
        url: `/wallet/savings/${plan.id}`,
      }),
    );

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
    const updated = applyDeposit(plan, amount, now);
    const cyclesCovered = plan.amount > 0 ? Math.floor(amount / plan.amount) : 0;
    Object.assign(plan, updated, { userId });
    const note =
      cyclesCovered > 1
        ? `Saved · covered ${cyclesCovered} ${plan.frequency === "daily" ? "days" : plan.frequency === "weekly" ? "weeks" : "months"} in advance · streak ${plan.streak} 🔥`
        : amount >= plan.amount
          ? `Saved · streak ${plan.streak} 🔥`
          : "Top-up (below cycle amount)";
    const tx: StoredTx = {
      ...txBase(userId, plan, now.toISOString()),
      kind: "savings_in",
      amount,
      note,
    };
    db.transactions.unshift(tx);
    await saveDb(db);

    // Duolingo-style notifications
    if (cyclesCovered > 1) {
      await emitPush((mod) =>
        mod.sendPushToUser(userId, {
          title: "🛡️ Streak Shield Activated!",
          body: `High discipline! You just covered ${cyclesCovered} ${plan.frequency === "daily" ? "days" : "cycles"} in advance for "${plan.name}". Rest easy!`,
          url: `/wallet/savings/${plan.id}`,
        }),
      );
    } else if (plan.streak >= 3) {
      await emitPush((mod) =>
        mod.sendPushToUser(userId, {
          title: "🔥 You're On Fire!",
          body: `Keep it up! Your streak on "${plan.name}" is now ${plan.streak} saves. Consistency pays!`,
          url: `/wallet/savings/${plan.id}`,
        }),
      );
    }

    return { plan: publicPlan(plan), tx, balance: wallet.balance };
  });
}

export async function withdrawFromPlan(
  userId: string,
  planId: string,
  amount: number | "all",
  close = false,
  breakPenaltyAgreed = false,
) {
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
    const met = isObjectiveMet(plan);

    // Check early withdrawal break fee
    let penalty = 0;
    if (!met && value > 0 && plan.target && plan.target > 0) {
      penalty = earlyWithdrawalPenalty(plan, value);
      if (penalty > 0 && !breakPenaltyAgreed) {
        throw new Error(`EARLY_PENALTY_REQUIRED:${penalty}`);
      }
    }

    const netValue = value - penalty;

    if (value > 0) {
      plan.balance -= value;
      wallet.balance += netValue;

      db.transactions.unshift({
        ...txBase(userId, plan, now),
        kind: "savings_out",
        amount: netValue,
        note: close ? "Plan closed · pot moved to wallet" : "Moved back to wallet",
      });

      if (penalty > 0) {
        plan.penalties = (plan.penalties || 0) + penalty;
        db.transactions.unshift({
          ...txBase(userId, plan, now),
          kind: "penalty",
          amount: penalty,
          note: `Early withdrawal fee (${Math.round(plan.penaltyRate * 100)}%) · goal of ${plan.target ? plan.target.toLocaleString() : ""} XAF not yet met`,
        });
      }
    }

    if (close || plan.balance === 0) {
      plan.status = "closed";
      plan.closedAt = now;
    }

    await saveDb(db);
    return { plan: publicPlan(plan), balance: wallet.balance, penalty };
  });
}

export async function updatePlanSettings(
  userId: string,
  planId: string,
  patch: Partial<Pick<SavingsPlan, "autoSave" | "penaltyRate" | "name" | "icon" | "emoji" | "target">>,
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
    if (patch.icon) plan.icon = String(patch.icon);
    if (patch.emoji) plan.emoji = String(patch.emoji).slice(0, 4);

    if (patch.target !== undefined) {
      const target = patch.target ? Math.round(Number(patch.target)) : null;
      // Objective is immutable: Once set, users cannot lower or cancel their goal!
      if (plan.target !== null && plan.target > 0) {
        if (target === null || target < plan.target) {
          throw new Error("Your savings objective is locked and cannot be lowered or removed.");
        }
      }
      if (target !== null && target < plan.amount) throw new Error("The goal must be at least one cycle amount.");
      plan.target = target;
      if (target && plan.balance >= target) {
        plan.status = "completed";
        plan.points = (plan.points || 0) + 500;
      }
    }
    await saveDb(db);
    return publicPlan(plan);
  });
}
