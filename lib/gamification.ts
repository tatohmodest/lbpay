import type { SavingsFrequency, SavingsPlan } from "@/lib/types";
import { formatXAF } from "@/lib/format";

export type SaverRank = {
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  level: number;
  minPoints: number;
  maxPoints: number;
  color: string;
  badgeBg: string;
};

export const SAVER_RANKS: SaverRank[] = [
  { tier: "Bronze", level: 1, minPoints: 0, maxPoints: 250, color: "text-amber-700", badgeBg: "bg-amber-100/70" },
  { tier: "Silver", level: 2, minPoints: 251, maxPoints: 750, color: "text-slate-600", badgeBg: "bg-slate-100" },
  { tier: "Gold", level: 3, minPoints: 751, maxPoints: 2000, color: "text-yellow-700", badgeBg: "bg-yellow-100/80" },
  { tier: "Diamond", level: 4, minPoints: 2001, maxPoints: 10000, color: "text-emerald-700", badgeBg: "bg-emerald-100" },
];

export function getSaverRank(totalPoints: number) {
  const pts = Math.max(0, totalPoints);
  const rank = SAVER_RANKS.slice().reverse().find((r) => pts >= r.minPoints) || SAVER_RANKS[0];
  const nextRank = SAVER_RANKS.find((r) => r.level === rank.level + 1);
  const span = nextRank ? nextRank.minPoints - rank.minPoints : 1000;
  const progress = nextRank ? Math.min(1, (pts - rank.minPoints) / span) : 1;
  return {
    ...rank,
    points: pts,
    nextThreshold: nextRank?.minPoints ?? rank.maxPoints,
    progress,
    pointsToNext: nextRank ? Math.max(0, nextRank.minPoints - pts) : 0,
  };
}

export function getStreakStatus(streak: number) {
  if (streak >= 30) {
    return { title: "Savings Legend", isHot: true, multiplier: 2.0, color: "text-purple-600" };
  }
  if (streak >= 14) {
    return { title: "Unstoppable Force", isHot: true, multiplier: 1.8, color: "text-amber-600" };
  }
  if (streak >= 7) {
    return { title: "On Fire!", isHot: true, multiplier: 1.5, color: "text-amber-500" };
  }
  if (streak >= 3) {
    return { title: "Gaining Heat", isHot: true, multiplier: 1.2, color: "text-orange-500" };
  }
  if (streak >= 1) {
    return { title: "Streak Started", isHot: false, multiplier: 1.0, color: "text-emerald-600" };
  }
  return { title: "No Streak", isHot: false, multiplier: 1.0, color: "text-muted" };
}

export type DuolingoNudge = {
  headline: string;
  message: string;
  tone: "fire" | "shield" | "urgent" | "goal" | "duo";
  actionLabel?: string;
  targetPlanId?: string;
};

export function getDuolingoNudge(plans: SavingsPlan[]): DuolingoNudge {
  const active = plans.filter((p) => p.status === "active");
  if (!active.length) {
    return {
      headline: "Start your streak today!",
      message: "Even 500 XAF a day adds up to 15,000 XAF each month. Build the habit and earn XP points!",
      tone: "duo",
      actionLabel: "Create first pot",
    };
  }

  // Check if any plan is overdue
  const now = +new Date();
  const overduePlan = active.find((p) => +new Date(p.nextDueAt) <= now);
  if (overduePlan) {
    return {
      headline: `Don't let your ${overduePlan.name} streak break!`,
      message: `Your save of ${formatXAF(overduePlan.amount)} is waiting. Save now to protect your ${overduePlan.streak}-cycle streak!`,
      tone: "urgent",
      actionLabel: "Save now",
      targetPlanId: overduePlan.id,
    };
  }

  // Check if any plan has prepayment
  const prepaidPlan = active.find((p) => (p.prepaidCycles ?? 0) > 0);
  if (prepaidPlan) {
    return {
      headline: `Streak Shield active on ${prepaidPlan.name}!`,
      message: `You covered multiple cycles in advance. No penalties can touch you until your next due date. Rest easy!`,
      tone: "shield",
      actionLabel: "View pot",
      targetPlanId: prepaidPlan.id,
    };
  }

  // Check highest streak
  const bestStreakPlan = active.slice().sort((a, b) => b.streak - a.streak)[0];
  if (bestStreakPlan && bestStreakPlan.streak >= 3) {
    return {
      headline: `You're on fire! ${bestStreakPlan.streak}-cycle streak!`,
      message: `Consistency is power. Keep saving regularly on "${bestStreakPlan.name}" to unlock multiplier bonus points!`,
      tone: "fire",
      actionLabel: "Keep it up",
      targetPlanId: bestStreakPlan.id,
    };
  }

  // Check close to target
  const nearGoal = active.find((p) => p.target && p.balance / p.target >= 0.7);
  if (nearGoal && nearGoal.target) {
    const percent = Math.round((nearGoal.balance / nearGoal.target) * 100);
    return {
      headline: `Goal within reach: ${percent}% reached!`,
      message: `You are only ${formatXAF(nearGoal.target - nearGoal.balance)} away from completing "${nearGoal.name}". Almost there!`,
      tone: "goal",
      actionLabel: "Finish goal",
      targetPlanId: nearGoal.id,
    };
  }

  return {
    headline: "Consistency beats intensity every time.",
    message: "You're building financial resilience step by step. Every deposit boosts your Saver XP!",
    tone: "duo",
  };
}
