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
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800", className)}>
        <Check className="h-3 w-3" /> Goal reached
      </span>
    );
  }
  if (plan.status === "closed") {
    return <span className={cn("inline-flex rounded-full bg-[#eef1ef] px-2 py-0.5 text-[11px] font-bold text-muted", className)}>Closed</span>;
  }
  const tone =
    state === "overdue"
      ? "bg-red-50 text-danger"
      : state === "today"
        ? "bg-amber-50 text-amber-800"
        : "bg-paper text-muted";
  const label =
    state === "overdue"
      ? "Due now"
      : state === "today"
        ? `Due in ${timeUntil(plan.nextDueAt)}`
        : `Next in ${timeUntil(plan.nextDueAt)}`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", tone, className)}>
      <AlarmClock className="h-3 w-3" /> {label}
    </span>
  );
}

export function Streak({ count, className }: { count: number; className?: string }) {
  const status = getStreakStatus(count);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5",
        status.isHot ? "bg-amber-100/80 text-amber-800 font-black" : count ? "bg-paper text-ink" : "bg-paper text-muted",
        className,
      )}
    >
      <Flame className={cn("h-3.5 w-3.5", status.isHot ? "fill-amber-500 text-amber-600 animate-pulse" : count ? "text-amber-500" : "text-muted")} />
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

  const toneClasses = {
    fire: "bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent border-amber-300/80 text-amber-950",
    shield: "bg-linear-to-r from-teal-500/15 via-emerald-500/10 to-transparent border-teal-300/80 text-teal-950",
    urgent: "bg-linear-to-r from-rose-500/15 via-red-500/10 to-transparent border-rose-300/80 text-rose-950",
    goal: "bg-linear-to-r from-indigo-500/15 via-blue-500/10 to-transparent border-indigo-300/80 text-indigo-950",
    duo: "bg-linear-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-300/80 text-emerald-950",
  }[nudge.tone];

  const iconClass = {
    fire: "bg-amber-500 text-white",
    shield: "bg-teal-600 text-white",
    urgent: "bg-rose-600 text-white animate-bounce",
    goal: "bg-indigo-600 text-white",
    duo: "bg-brand text-white",
  }[nudge.tone];

  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border p-4 sm:p-5 transition shadow-sm", toneClasses)}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm text-lg", iconClass)}>
          {nudge.tone === "fire" ? (
            <Flame className="h-6 w-6 fill-white" />
          ) : nudge.tone === "shield" ? (
            <Shield className="h-6 w-6 fill-white" />
          ) : nudge.tone === "goal" ? (
            <Trophy className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-dark">
              Discipline Coach
            </span>
          </div>
          <p className="mt-0.5 text-sm font-black sm:text-base leading-snug">{nudge.headline}</p>
          <p className="mt-1 text-xs opacity-90 leading-relaxed">{nudge.message}</p>
        </div>
        {nudge.actionLabel ? (
          <button
            type="button"
            onClick={() => onAction?.(nudge.targetPlanId)}
            className="self-center shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-black shadow-sm ring-1 ring-black/5 hover:bg-paper transition"
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
  const gridId = useId().replace(/:/g, "");
  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });
  const rank = getSaverRank(points);

  return (
    <section className="lb-house-card relative flex min-h-[14rem] flex-col overflow-hidden rounded-[1.75rem] p-5 text-white sm:min-h-[16rem]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.28]" aria-hidden>
        <defs>
          <pattern id={gridId} width="28" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <path d="M28 0H0V48" fill="none" stroke="white" strokeWidth="0.9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SAVINGS_FLOAT}
        alt=""
        width={80}
        height={80}
        className="pointer-events-none absolute right-2.5 top-2.5 z-10 h-[4.35rem] w-[4.35rem] object-contain drop-shadow-[0_10px_18px_rgba(6,38,28,0.28)] sm:right-3.5 sm:top-3.5 sm:h-[4.85rem] sm:w-[4.85rem]"
      />
      <div className="relative z-10 flex items-start justify-between gap-3 pr-[4.75rem]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              {rank.tier} Saver · Lvl {rank.level}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-white/80 font-bold">
              <Sparkles className="h-3 w-3 text-amber-300" /> {points} XP
            </span>
          </div>
          <p className="mt-1.5 text-[15px] font-semibold text-white/90">Total in your pots</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label={hidden ? "Show amount" : "Hide amount"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="relative z-10 mt-4 min-w-0 pr-2">
        <p className="font-mono text-[2.15rem] font-black leading-none tracking-tight sm:text-[2.4rem]">
          {shown}
          {hidden ? null : <span className="ml-1.5 text-sm font-semibold tracking-normal text-white/80">XAF</span>}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold">{active} active pots</span>
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold">
            {hidden ? "••••" : formatXAF(pace, { withCurrency: false })} / mo
          </span>
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1">
            <Flame className="h-3 w-3 fill-amber-300 text-amber-300" /> {streak} max streak
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="relative z-10 mt-auto flex items-center justify-between border-t border-white/20 pt-3 text-sm font-black hover:text-white/90 transition"
      >
        + Create new pot
        <ArrowRight className="h-4 w-4" />
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
        "group block rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_rgba(12,25,19,0.05)] ring-1 transition hover:-translate-y-0.5 hover:ring-brand/40",
        urgent && plan.status === "active" ? "ring-amber-200" : "ring-line/80",
      )}
    >
      <Link href={`/wallet/savings/${encodeURIComponent(plan.id)}`} className="block">
        <div className="flex items-center gap-3.5">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center text-brand">
            <ProgressRing value={progress} size={56} stroke={5} className="absolute inset-0" />
            <PlanIcon icon={plan.icon || plan.emoji} size="md" className="h-10 w-10 rounded-xl" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-black text-ink">{plan.name}</p>
              {plan.autoSave ? <Zap className="h-3.5 w-3.5 shrink-0 text-brand" aria-label="Auto-save on" /> : null}
            </div>
            <p className="truncate text-xs text-muted">
              {formatXAF(plan.amount, { withCurrency: false })}
              {plan.frequency === "daily" ? "/day" : plan.frequency === "weekly" ? "/week" : "/month"}
              {plan.target ? ` · goal ${formatXAF(plan.target, { withCurrency: false })}` : " · open goal"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DueChip plan={plan} />
              <Streak count={plan.streak} />
              {hasPrepay ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                  <Shield className="h-3 w-3" /> Shielded
                </span>
              ) : null}
              {plan.target ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
                  <Lock className="h-2.5 w-2.5" /> {Math.round(plan.penaltyRate * 100)}% lock
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-base font-black text-ink">{formatXAF(plan.balance, { withCurrency: false })}</p>
            <p className="text-[11px] text-muted">{progress != null ? `${Math.round(progress * 100)}%` : "saved"}</p>
          </div>
        </div>
      </Link>

      {!compact && plan.status === "active" ? (
        <div className="mt-3.5 flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-[12px]">
          <span className="text-muted text-xs">
            Miss a {plan.frequency} save: <span className="font-bold text-ink">{formatXAF(penaltyFor(plan))}</span> cut.
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSaveNow ? onSaveNow(plan) : undefined;
            }}
            className="font-black text-brand-deep hover:underline cursor-pointer"
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
