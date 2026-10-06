import type { SavingsFrequency, SavingsPlan } from "@/lib/types";

/** Pure savings-plan rules shared by the API and the UI. No I/O here. */

export const SAVINGS = {
  minAmount: 100,
  maxAmount: 5_000_000,
  defaultPenaltyRate: 0.05,
  minPenaltyRate: 0.01,
  maxPenaltyRate: 0.25,
  /** Never charge more than this many missed cycles in one catch-up pass. */
  maxPenaltiesPerSettle: 10,
  maxActivePlans: 12,
} as const;

export const FREQUENCIES: Array<{ value: SavingsFrequency; label: string; every: string; perMonth: number }> = [
  { value: "daily", label: "Daily", every: "every day", perMonth: 30 },
  { value: "weekly", label: "Weekly", every: "every week", perMonth: 4 },
  { value: "monthly", label: "Monthly", every: "every month", perMonth: 1 },
];

export const PLAN_ICONS = [
  { id: "target", label: "Goal" },
  { id: "home", label: "Home" },
  { id: "car", label: "Vehicle" },
  { id: "graduation", label: "School" },
  { id: "plane", label: "Travel" },
  { id: "shield", label: "Emergency" },
  { id: "smartphone", label: "Tech" },
  { id: "shopping", label: "Shopping" },
  { id: "briefcase", label: "Business" },
  { id: "heart", label: "Health" },
  { id: "gem", label: "Luxury" },
  { id: "sparkles", label: "Dream" },
] as const;

export const PLAN_EMOJIS = ["🎯", "🏠", "🚗", "📚", "✈️", "💍", "🛡️", "📱", "🎓", "🏥", "🛍️", "💼"];

export function frequencyLabel(freq: SavingsFrequency) {
  return FREQUENCIES.find((f) => f.value === freq)?.label || freq;
}

export function frequencyEvery(freq: SavingsFrequency) {
  return FREQUENCIES.find((f) => f.value === freq)?.every || freq;
}

export function cyclesPerMonth(freq: SavingsFrequency) {
  return FREQUENCIES.find((f) => f.value === freq)?.perMonth || 1;
}

/** Add one cycle to an ISO date. Monthly keeps the day-of-month where possible. */
export function addCycle(iso: string, freq: SavingsFrequency) {
  const d = new Date(iso);
  if (freq === "daily") d.setUTCDate(d.getUTCDate() + 1);
  else if (freq === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d.toISOString();
}

/** Advance a date by N cycles. */
export function advanceCycles(iso: string, freq: SavingsFrequency, count: number): string {
  let current = iso;
  for (let i = 0; i < count; i++) {
    current = addCycle(current, freq);
  }
  return current;
}

/** First due date: the end of the cycle that starts now (Cameroon midnight for daily plans). */
export function firstDueAt(freq: SavingsFrequency, now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(23, 0, 0, 0); // 23:00 UTC = 00:00 Africa/Douala
  if (start <= now) start.setUTCDate(start.getUTCDate() + 1);
  if (freq === "daily") return start.toISOString();
  return addCycle(start.toISOString(), freq);
}

export function penaltyFor(plan: Pick<SavingsPlan, "amount" | "penaltyRate">) {
  return Math.round(plan.amount * plan.penaltyRate);
}

export function clampPenaltyRate(value: number) {
  if (!Number.isFinite(value)) return SAVINGS.defaultPenaltyRate;
  return Math.min(SAVINGS.maxPenaltyRate, Math.max(SAVINGS.minPenaltyRate, Math.round(value * 100) / 100));
}

export function planProgress(plan: Pick<SavingsPlan, "balance" | "target">) {
  if (!plan.target) return null;
  return Math.min(1, plan.balance / plan.target);
}

/** Calculate target completion date given rhythm and cycle duration count. */
export function calculateTargetDate(frequency: SavingsFrequency, count: number, fromDate = new Date()): string {
  if (count <= 0) return fromDate.toISOString();
  return advanceCycles(fromDate.toISOString(), frequency, count);
}

/** Formats a duration count nicely with unit. */
export function durationLabel(frequency: SavingsFrequency, count: number): string {
  if (frequency === "daily") {
    if (count === 7) return "1 week (7 days)";
    if (count === 14) return "2 weeks (14 days)";
    if (count === 30) return "1 month (30 days)";
    if (count === 60) return "2 months (60 days)";
    if (count === 90) return "3 months (90 days)";
    if (count === 365) return "1 year (365 days)";
    return `${count} day${count === 1 ? "" : "s"}`;
  }
  if (frequency === "weekly") {
    if (count === 4) return "1 month (4 weeks)";
    if (count === 8) return "2 months (8 weeks)";
    if (count === 12) return "3 months (12 weeks)";
    if (count === 26) return "6 months (26 weeks)";
    if (count === 52) return "1 year (52 weeks)";
    return `${count} week${count === 1 ? "" : "s"}`;
  }
  if (frequency === "monthly") {
    if (count === 12) return "1 year (12 months)";
    if (count === 24) return "2 years (24 months)";
    return `${count} month${count === 1 ? "" : "s"}`;
  }
  return `${count} cycles`;
}

/** Checks whether a plan's savings objective (target amount or maturity date) has been met. */
export function isObjectiveMet(
  plan: Pick<SavingsPlan, "balance" | "target"> & { targetDate?: string },
  now = new Date(),
) {
  // If target amount is set and reached
  if (plan.target && plan.target > 0 && plan.balance >= plan.target) return true;
  // If target date is set and has arrived (maturity reached) with funds
  if (plan.targetDate && +now >= +new Date(plan.targetDate) && plan.balance > 0) {
    return true;
  }
  // Open pot with no target amount and no target date
  if (!plan.target && !plan.targetDate) return true;
  return false;
}

/** Computes the early withdrawal fee if objective is not yet reached. */
export function earlyWithdrawalPenalty(
  plan: Pick<SavingsPlan, "balance" | "target" | "penaltyRate"> & { targetDate?: string },
  amount: number,
) {
  if (isObjectiveMet(plan)) return 0;
  return Math.round(amount * plan.penaltyRate);
}

/** Calculate how many cycles an advance deposit covers and the new due date. */
export function calculateAdvanceCoverage(
  depositAmount: number,
  cycleAmount: number,
  frequency: SavingsFrequency,
  currentDueAt: string,
) {
  if (cycleAmount <= 0) return { cycles: 0, nextDueAt: currentDueAt, surplus: 0, points: 0 };
  const cycles = Math.floor(depositAmount / cycleAmount);
  const surplus = depositAmount % cycleAmount;
  const nextDueAt = cycles >= 1 ? advanceCycles(currentDueAt, frequency, cycles) : currentDueAt;
  const points = cycles >= 1 ? cycles * 50 + (cycles > 1 ? (cycles - 1) * 25 : 0) : 10;
  return { cycles, nextDueAt, surplus, points };
}

/** Whole cycles remaining to reach the target at the current pace. */
export function cyclesToTarget(plan: Pick<SavingsPlan, "balance" | "target" | "amount">) {
  if (!plan.target || plan.amount <= 0) return null;
  return Math.max(0, Math.ceil((plan.target - plan.balance) / plan.amount));
}

export function estimatedFinishAt(plan: Pick<SavingsPlan, "balance" | "target" | "amount" | "frequency" | "nextDueAt">) {
  const cycles = cyclesToTarget(plan);
  if (cycles === null) return null;
  let when = plan.nextDueAt;
  for (let i = 1; i < cycles; i++) when = addCycle(when, plan.frequency);
  return when;
}

export type DueState = "overdue" | "today" | "soon" | "later" | "done";

export function dueState(plan: Pick<SavingsPlan, "nextDueAt" | "status">, now = new Date()): DueState {
  if (plan.status !== "active") return "done";
  const ms = +new Date(plan.nextDueAt) - +now;
  if (ms <= 0) return "overdue";
  if (ms <= 24 * 3600_000) return "today";
  if (ms <= 3 * 24 * 3600_000) return "soon";
  return "later";
}

export function timeUntil(iso: string, now = new Date()) {
  const ms = +new Date(iso) - +now;
  if (ms <= 0) return "now";
  const hours = Math.floor(ms / 3600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))} min`;
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)} days`;
}

export type SavingsInput = {
  name: string;
  emoji?: string;
  icon?: string;
  frequency: SavingsFrequency;
  amount: number;
  target?: number | null;
  targetDate?: string;
  durationCycles?: number;
  penaltyRate?: number;
  autoSave?: boolean;
};

export function validatePlanInput(input: Partial<SavingsInput>) {
  const name = String(input.name || "").trim();
  if (name.length < 2) return "Give the plan a name (at least 2 characters).";
  if (name.length > 40) return "Plan name is too long (40 characters max).";
  if (!["daily", "weekly", "monthly"].includes(String(input.frequency))) return "Pick daily, weekly or monthly.";
  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount < SAVINGS.minAmount) return `Save at least ${SAVINGS.minAmount} XAF per cycle.`;
  if (amount > SAVINGS.maxAmount) return `That is above the ${SAVINGS.maxAmount.toLocaleString()} XAF per-cycle limit.`;
  if (input.target != null && input.target !== 0) {
    const target = Number(input.target);
    if (!Number.isInteger(target) || target < amount) return "The goal must be at least one cycle amount.";
  }
  if (input.penaltyRate != null) {
    const rate = Number(input.penaltyRate);
    if (!Number.isFinite(rate) || rate < SAVINGS.minPenaltyRate - 1e-9 || rate > SAVINGS.maxPenaltyRate + 1e-9) {
      return `Penalty must be between 1% and ${Math.round(SAVINGS.maxPenaltyRate * 100)}%.`;
    }
  }
  return "";
}

/**
 * Settle every cycle that has fallen due. Pure: returns the updated plan plus the
 * wallet moves to record. `walletBalance` is the caller's available wallet balance.
 */
export function settlePlan(
  plan: SavingsPlan,
  walletBalance: number,
  now = new Date(),
): {
  plan: SavingsPlan;
  moves: Array<{ type: "auto_save" | "penalty_wallet" | "penalty_pot" | "missed_free"; amount: number; dueAt: string }>;
} {
  if (plan.status !== "active") return { plan, moves: [] };
  let next = { ...plan };
  let wallet = walletBalance;
  const moves: ReturnType<typeof settlePlan>["moves"] = [];
  let charged = 0;
  let guard = 0;
  while (+new Date(next.nextDueAt) <= +now && guard < 400) {
    guard += 1;
    const dueAt = next.nextDueAt;
    if (next.autoSave && wallet >= next.amount) {
      wallet -= next.amount;
      next = {
        ...next,
        balance: next.balance + next.amount,
        saved: next.saved + next.amount,
        streak: next.streak + 1,
        bestStreak: Math.max(next.bestStreak, next.streak + 1),
        lastDepositAt: dueAt,
        points: (next.points || 0) + 50,
      };
      moves.push({ type: "auto_save", amount: next.amount, dueAt });
    } else {
      const penalty = penaltyFor(next);
      next = { ...next, missed: next.missed + 1, streak: 0 };
      if (charged >= SAVINGS.maxPenaltiesPerSettle || penalty <= 0) {
        moves.push({ type: "missed_free", amount: 0, dueAt });
      } else if (wallet >= penalty) {
        wallet -= penalty;
        charged += 1;
        next = { ...next, penalties: next.penalties + penalty };
        moves.push({ type: "penalty_wallet", amount: penalty, dueAt });
      } else if (next.balance >= penalty) {
        charged += 1;
        next = { ...next, balance: next.balance - penalty, penalties: next.penalties + penalty };
        moves.push({ type: "penalty_pot", amount: penalty, dueAt });
      } else {
        moves.push({ type: "missed_free", amount: 0, dueAt });
      }
    }
    next.nextDueAt = addCycle(dueAt, next.frequency);
    if (next.target && next.balance >= next.target) {
      next.status = "completed";
      next.points = (next.points || 0) + 500;
      break;
    }
  }
  return { plan: next, moves };
}

/** Apply a manual deposit. Supports multi-cycle advance prepayments and streak bonuses. */
export function applyDeposit(plan: SavingsPlan, amount: number, now = new Date()) {
  const cyclesCovered = plan.amount > 0 ? Math.floor(amount / plan.amount) : 0;
  let nextDue = plan.nextDueAt;
  let newStreak = plan.streak;

  if (cyclesCovered >= 1) {
    nextDue = advanceCycles(plan.nextDueAt, plan.frequency, cyclesCovered);
    newStreak = plan.streak + cyclesCovered;
  }

  // Calculate Points: 50 base per cycle + 25 bonus per advance cycle + streak milestone bonus
  const basePts = cyclesCovered > 0 ? cyclesCovered * 50 : 10;
  const prepayBonus = cyclesCovered > 1 ? (cyclesCovered - 1) * 25 : 0;
  const streakBonus = Math.floor(newStreak / 5) * 10;
  const earnedPts = basePts + prepayBonus + streakBonus;

  const next: SavingsPlan = {
    ...plan,
    balance: plan.balance + amount,
    saved: plan.saved + amount,
    lastDepositAt: now.toISOString(),
    streak: newStreak,
    bestStreak: Math.max(plan.bestStreak, newStreak),
    nextDueAt: nextDue,
    points: (plan.points || 0) + earnedPts,
    prepaidCycles: (plan.prepaidCycles || 0) + (cyclesCovered > 1 ? cyclesCovered - 1 : 0),
  };

  if (next.target && next.balance >= next.target) {
    next.status = "completed";
    next.points = (next.points || 0) + 500;
  }
  return next;
}

export function monthlyPace(plan: Pick<SavingsPlan, "amount" | "frequency">) {
  return plan.amount * cyclesPerMonth(plan.frequency);
}
