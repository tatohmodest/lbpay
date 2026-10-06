"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";
import {
  AlarmClock,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Flame,
  Lock,
  PiggyBank,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useHiddenAmount } from "@/components/house-card";
import { SAVINGS_FLOAT } from "@/lib/assets";
import { PlanIcon } from "@/components/plan-icon";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { getDuolingoNudge, getSaverRank, getStreakStatus } from "@/lib/gamification";
import {
  dueState,
  penaltyFor,
  planProgress,
  timeUntil,
} from "@/lib/savings";
import type { SavingsPlan } from "@/lib/types";

export { SavingsModal } from "@/components/savings-modal";
export { SavingsDepositModal, SavingsWithdrawModal } from "@/components/savings-action-modals";

/* ---------- small pieces ---------- */

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  className,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 1 : Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn("-rotate-90", className)} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
        style={value == null ? { strokeDasharray: `${c * 0.25} ${c}` } : undefined}
      />
    </svg>
  );
}

export function DueChip({ plan, className }: { plan: SavingsPlan; className?: string }) {
  const state = dueState(plan);
  if (plan.status === "completed") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-[#E4F6EB] px-2.5 py-0.5 text-[10px] font-bold text-[#249652]", className)}>
        <Check className="h-3 w-3" /> Goal reached
      </span>
    );
  }
  if (plan.status === "closed") {
    return <span className={cn("inline-flex rounded-full bg-[#EFF2F6] px-2.5 py-0.5 text-[10px] font-semibold text-neutral-500", className)}>Closed</span>;
  }
  const tone =
    state === "overdue"
      ? "bg-[#FEE2E2] text-[#EF4444]"
      : state === "today"
        ? "bg-[#FEF3C7] text-[#D97706]"
        : "bg-[#EFF2F6] text-neutral-700";
  const label =
    state === "overdue"
      ? "Due now"
      : state === "today"
        ? `Due in ${timeUntil(plan.nextDueAt)}`
        : `Next in ${timeUntil(plan.nextDueAt)}`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", tone, className)}>
      <AlarmClock className="h-3 w-3" /> {label}
    </span>
  );
}

export function Streak({ count, className }: { count: number; className?: string }) {
  const status = getStreakStatus(count);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-0.5 bg-[#EFF2F6] text-neutral-800",
        status.isHot ? "bg-amber-100/80 text-amber-900 font-bold" : "",
        className,
      )}
    >
      <Flame className={cn("h-3 w-3", status.isHot ? "fill-amber-500 text-amber-600 animate-pulse" : count ? "text-amber-500" : "text-neutral-400")} />
      {count} streak
    </span>
  );
}

/* ---------- DUOLINGO-STYLE NUDGE BANNER ---------- */

export function DuolingoNudgeCard({
  plans,
  onAction,
}: {
  plans: SavingsPlan[];
  onAction?: (targetPlanId?: string) => void;
}) {
  const nudge = getDuolingoNudge(plans);

  return (
    <div className="bg-[#EFF2F6] rounded-[24px] p-4 sm:p-5 border border-neutral-200/50 shadow-xs transition">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
          {nudge.tone === "fire" ? (
            <Flame className="h-5 w-5 fill-white" />
          ) : nudge.tone === "shield" ? (
            <Shield className="h-5 w-5 fill-white" />
          ) : nudge.tone === "goal" ? (
            <Trophy className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Discipline Coach
          </span>
          <p className="mt-0.5 text-xs sm:text-sm font-bold text-neutral-900 leading-snug">{nudge.headline}</p>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{nudge.message}</p>
        </div>
        {nudge.actionLabel ? (
          <button
            type="button"
            onClick={() => onAction?.(nudge.targetPlanId)}
            className="self-center shrink-0 rounded-full bg-white text-black px-3.5 py-1.5 text-xs font-semibold shadow-xs border border-neutral-200/60 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
          >
            {nudge.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- SAVINGS HERO DASHBOARD ---------- */

export function SavingsHero({
  amount,
  active,
  pace,
  streak,
  points = 0,
  onNew,
}: {
  amount: number;
  active: number;
  pace: number;
  streak: number;
  points?: number;
  onNew: () => void;
}) {
  const { hidden, toggle } = useHiddenAmount();
  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });
  const rank = getSaverRank(points);

  return (
    <section className="bg-black text-white rounded-[26px] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[14rem]">
      {/* Top Half: Balance & New Pot */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-neutral-400 text-xs font-normal">Savings Balance</span>
          <div className="flex items-center space-x-2.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              {shown}
              {hidden ? null : <span className="ml-1.5 text-xs font-normal text-neutral-400">XAF</span>}
            </span>
            <button
              type="button"
              onClick={toggle}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label={hidden ? "Show amount" : "Hide amount"}
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNew}
          className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-full hover:bg-neutral-100 active:scale-95 transition shadow-sm cursor-pointer"
        >
          + New Pot
        </button>
      </div>

      {/* Middle Pills */}
      <div className="flex flex-wrap gap-1.5 my-4">
        <span className="bg-white/10 text-white rounded-full px-3 py-1 text-[11px] font-semibold">
          {active} active {active === 1 ? "pot" : "pots"}
        </span>
        <span className="bg-white/10 text-white rounded-full px-3 py-1 text-[11px] font-semibold">
          {hidden ? "••••" : formatXAF(pace, { withCurrency: false })} / mo
        </span>
        <span className="bg-white/10 text-white rounded-full px-3 py-1 text-[11px] font-semibold flex items-center gap-1">
          <Flame className="h-3 w-3 fill-amber-300 text-amber-300" /> {streak} streak
        </span>
        <span className="bg-white/10 text-white rounded-full px-3 py-1 text-[11px] font-semibold">
          ⭐ {points} XP ({rank.tier})
        </span>
      </div>

      {/* Bottom Action Pill */}
      <button
        type="button"
        onClick={onNew}
        className="bg-white/10 hover:bg-white/15 text-white rounded-full py-2.5 px-4 flex items-center justify-between text-xs font-semibold active:scale-98 transition cursor-pointer"
      >
        <span>Start new sprint or milestone</span>
        <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
      </button>
    </section>
  );
}

/* ---------- PLAN CARD ---------- */

export function PlanCard({
  plan,
  compact = false,
  onSaveNow,
}: {
  plan: SavingsPlan;
  compact?: boolean;
  onSaveNow?: (plan: SavingsPlan) => void;
}) {
  const progress = planProgress(plan);
  const state = dueState(plan);
  const urgent = state === "overdue" || state === "today";
  const hasPrepay = (plan.prepaidCycles ?? 0) > 0;

  return (
    <div
      className={cn(
        "group block rounded-[24px] bg-white p-4.5 border transition",
        urgent && plan.status === "active" ? "border-amber-300 shadow-sm" : "border-neutral-200/70 shadow-xs hover:border-black/30",
      )}
    >
      <Link href={`/wallet/savings/${encodeURIComponent(plan.id)}`} className="block">
        <div className="flex items-center gap-3.5">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center text-black">
            <ProgressRing value={progress} size={48} stroke={4} className="absolute inset-0" />
            <PlanIcon icon={plan.icon || plan.emoji} size="sm" className="h-8 w-8 rounded-full" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-neutral-900">{plan.name}</p>
              {plan.autoSave ? <Zap className="h-3 w-3 shrink-0 text-black" aria-label="Auto-save on" /> : null}
            </div>
            <p className="truncate text-[11px] text-neutral-400 mt-0.5">
              {formatXAF(plan.amount, { withCurrency: false })}
              {plan.frequency === "daily" ? "/day" : plan.frequency === "weekly" ? "/week" : "/month"}
              {plan.durationCycles
                ? ` · ${plan.durationCycles} ${plan.frequency === "daily" ? "days" : plan.frequency === "weekly" ? "weeks" : "months"}`
                : ""}
              {plan.target ? ` · goal ${formatXAF(plan.target, { withCurrency: false })}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DueChip plan={plan} />
              <Streak count={plan.streak} />
              {hasPrepay ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F6EB] text-[#249652] px-2 py-0.5 text-[10px] font-bold">
                  <Shield className="h-3 w-3" /> Shielded
                </span>
              ) : null}
              {plan.target ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF2F6] px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                  <Lock className="h-2.5 w-2.5" /> {Math.round(plan.penaltyRate * 100)}% lock
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-base font-bold text-neutral-900">{formatXAF(plan.balance, { withCurrency: false })}</p>
            <p className="text-[10px] text-neutral-400">{progress != null ? `${Math.round(progress * 100)}%` : "saved"}</p>
          </div>
        </div>
      </Link>

      {!compact && plan.status === "active" ? (
        <div className="mt-3 flex items-center justify-between rounded-full bg-[#F8F9FA] px-3.5 py-1.5 text-xs border border-neutral-100">
          <span className="text-[11px] text-neutral-400">
            Pledge: <span className="font-bold text-neutral-900">{Math.round(plan.penaltyRate * 100)}%</span> (0% on goal)
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSaveNow ? onSaveNow(plan) : undefined;
            }}
            className="bg-black text-white text-[11px] font-semibold px-3 py-1 rounded-full hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
          >
            Save / Prepay →
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- EMPTY STATE ---------- */

export function SavingsEmpty({ onNew }: { onNew?: () => void; href?: string }) {
  return (
    <div
      onClick={onNew}
      className="group block overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80 shadow-[0_10px_30px_rgba(6,38,28,0.06)] transition hover:shadow-[0_16px_40px_rgba(6,38,28,0.12)] cursor-pointer"
    >
      <Image
        src="/illustrations/savings-banner.webp"
        alt="Small savings, big dreams, real money. Save just 500 XAF a day and get 15,000 XAF a month."
        width={744}
        height={528}
        priority
        className="aspect-[744/528] w-full object-cover"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-black leading-tight text-ink">Start your savings habit</p>
          <p className="mt-0.5 truncate text-xs text-muted">Save daily, weekly, or monthly. Build streaks & earn points.</p>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-white transition group-hover:bg-brand-dark">
          <PiggyBank className="h-3.5 w-3.5" /> Start saving
        </span>
      </div>
    </div>
  );
}
