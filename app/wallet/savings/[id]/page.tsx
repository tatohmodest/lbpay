"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Flame,
  Lock,
  Shield,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { StatusBadge } from "@/components/ui/badge";
import { DueChip, ProgressRing, SavingsDepositModal, SavingsWithdrawModal, Streak } from "@/components/savings";
import { PlanIcon } from "@/components/plan-icon";
import { MoneyRow } from "@/components/money-hub";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useMe, useSavingsAction, useSavingsPlan } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import {
  SAVINGS,
  cyclesToTarget,
  estimatedFinishAt,
  frequencyEvery,
  isObjectiveMet,
  penaltyFor,
  planProgress,
  timeUntil,
} from "@/lib/savings";
import { txHref } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

export default function SavingsPlanPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const router = useRouter();
  const notify = useNotify();
  const me = useMe();
  const planQuery = useSavingsPlan(id);
  const act = useSavingsAction(id);
  const plan = planQuery.data?.plan ?? me.data?.savings?.find((p) => p.id === id);
  const balance = me.data?.balance ?? 0;

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const history = ((me.data?.transactions as Transaction[] | undefined) || [])
    .filter((tx) => tx.meta?.planId === id)
    .slice(0, 15);

  if (planQuery.isError && !plan) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line">
          This savings pot could not be found.
        </p>
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <div className="h-44 animate-pulse rounded-[1.75rem] bg-white ring-1 ring-line/60" />
        <div className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-line/60" />
      </div>
    );
  }

  const progress = planProgress(plan);
  const left = cyclesToTarget(plan);
  const finish = estimatedFinishAt(plan);
  const active = plan.status === "active";
  const met = isObjectiveMet(plan);
  const hasPrepay = (plan.prepaidCycles ?? 0) > 0;

  async function handleClosePlan(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      await act.mutateAsync({ action: "close", pin });
      notify.moneyIn(plan!.balance, `${plan!.name} closed · funds returned to wallet`);
      router.push("/wallet/savings");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not close plan", fail.error);
    }
  }

  async function toggleAutoSave() {
    try {
      await act.mutateAsync({ action: "settings", autoSave: !plan!.autoSave });
      notify.info(
        "Auto-save updated",
        plan!.autoSave
          ? "Turned off. You will need to save or prepay manually."
          : `Turned on. ${formatXAF(plan!.amount)} will be pulled from your wallet on each cycle.`,
      );
    } catch (err) {
      notify.error("Could not update", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      {/* Left Column: Plan Card & Stats */}
      <div className="space-y-5 lg:col-span-5">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet/savings"
            className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-line/80 hover:bg-paper transition"
            aria-label="Back to savings"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-ink">{plan.name}</h1>
            <p className="text-xs text-muted font-semibold">
              {formatXAF(plan.amount)} {frequencyEvery(plan.frequency)}
            </p>
          </div>
        </div>

        {/* Hero Card */}
        <section className="overflow-hidden rounded-[1.85rem] bg-forest p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <span className="relative grid h-24 w-24 shrink-0 place-items-center text-brand">
              <ProgressRing value={progress} size={96} stroke={8} className="absolute inset-0" />
              <div className="text-center">
                <span className="block font-mono text-xl font-black leading-none text-white">
                  {progress != null ? `${Math.round(progress * 100)}%` : "∞"}
                </span>
                <span className="block text-[10px] font-semibold text-hero-muted mt-0.5">
                  {progress != null ? "of goal" : "open pot"}
                </span>
              </div>
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-hero-muted">Current Balance</p>
              <p className="font-mono text-[2rem] font-black leading-none tracking-tight">
                {formatXAF(plan.balance, { withCurrency: false })} <span className="text-sm font-bold text-hero-muted">XAF</span>
              </p>
              {plan.target ? (
                <p className="mt-1 text-xs text-hero-muted font-medium">Goal: {formatXAF(plan.target)}</p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <DueChip plan={plan} />
                <Streak count={plan.streak} className="text-amber-300" />
                {hasPrepay ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/20 px-2 py-0.5 text-[11px] font-bold text-teal-200">
                    <Shield className="h-3 w-3" /> Shield Active
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {active ? (
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDepositOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,179,105,0.3)] hover:bg-brand-dark transition cursor-pointer"
              >
                <ArrowDownToLine className="h-4 w-4" /> Save / Prepay
              </button>
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                disabled={!plan.balance}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/15 transition disabled:opacity-40 cursor-pointer"
              >
                <ArrowUpFromLine className="h-4 w-4" /> Withdraw
              </button>
            </div>
          ) : plan.status === "completed" ? (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-white/10 p-3.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-300" />
                <span className="text-xs font-bold">Goal reached! Claim with 0% fees.</span>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-forest hover:bg-paper cursor-pointer"
              >
                Collect all
              </button>
            </div>
          ) : null}

          {plan.durationCycles ? (
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs">
              <div className="flex items-center justify-between font-bold text-white/90 mb-1">
                <span>
                  {plan.frequency === "daily" ? "Day" : plan.frequency === "weekly" ? "Week" : "Month"}{" "}
                  {Math.min(plan.durationCycles, Math.floor(plan.balance / (plan.amount || 1)))} of {plan.durationCycles}
                </span>
                <span>
                  {Math.min(100, Math.round((plan.balance / (plan.amount * plan.durationCycles)) * 100))}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((plan.balance / (plan.amount * plan.durationCycles)) * 100))}%`,
                  }}
                />
              </div>
              {plan.targetDate ? (
                <p className="mt-1.5 text-[10px] text-hero-muted font-medium">
                  Target maturity: {formatDate(plan.targetDate)}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-2.5">
          <StatTile
            icon={CalendarClock}
            label="Next Save"
            value={active ? timeUntil(plan.nextDueAt) : "—"}
            hint={active ? formatDate(plan.nextDueAt) : plan.status}
          />
          <StatTile
            icon={Target}
            label="Goal Distance"
            value={left != null ? `${left} saves` : "Open"}
            hint={finish ? `≈ ${formatDate(finish)}` : "No deadline"}
          />
          <StatTile
            icon={Flame}
            label="Best Streak"
            value={`${plan.bestStreak} cycles`}
            hint={plan.missed ? `${plan.missed} missed` : "0 missed"}
          />
          <StatTile
            icon={Lock}
            label="Commitment Fee"
            value={`${Math.round(plan.penaltyRate * 100)}%`}
            hint={met ? "0% fee (Goal met!)" : "Early exit fee"}
          />
        </section>

        {/* Auto-save Switch */}
        {active ? (
          <button
            type="button"
            onClick={toggleAutoSave}
            disabled={act.isPending}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-line/80 hover:ring-brand/40 transition"
          >
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl",
                plan.autoSave ? "bg-brand-soft text-brand-deep" : "bg-paper text-muted",
              )}
            >
              <Zap className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-ink">Auto-save: {plan.autoSave ? "On" : "Off"}</span>
              <span className="block text-xs text-muted">
                {plan.autoSave
                  ? `Pulls ${formatXAF(plan.amount)} from wallet when due.`
                  : "Tap to turn on automatic deductions."}
              </span>
            </span>
            <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", plan.autoSave ? "bg-brand" : "bg-line")}>
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                  plan.autoSave ? "left-[1.375rem]" : "left-0.5",
                )}
              />
            </span>
          </button>
        ) : null}
      </div>

      {/* Right Column: Rules & Activity History */}
      <div className="space-y-5 lg:col-span-7">
        {/* Objective & Lock Accountability Card */}
        <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80">
          <div className="flex items-center gap-2.5">
            <PlanIcon icon={plan.icon || plan.emoji} size="sm" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Pot Contract</p>
              <h2 className="text-base font-black text-ink">Rules & Commitment</h2>
            </div>
          </div>
          <ul className="mt-3.5 space-y-2 text-xs text-muted leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>
                <strong>Rhythm:</strong> Save {formatXAF(plan.amount)} every{" "}
                {plan.frequency === "daily" ? "day" : plan.frequency === "weekly" ? "week" : "month"}.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>
                <strong>Prepay & Protect:</strong> You can deposit for multiple days/weeks in advance. Your due date pushes
                forward, shielding you from missed-save penalties!
              </span>
            </li>
            {plan.target ? (
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  <strong>Locked Objective:</strong> Your goal of{" "}
                  <strong className="text-ink">{formatXAF(plan.target)}</strong> is locked and cannot be lowered. If you
                  withdraw early before meeting this goal, a {Math.round(plan.penaltyRate * 100)}% commitment penalty is
                  forfeited. Once met, withdrawal is 100% free!
                </span>
              </li>
            ) : null}
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>
                <strong>Saver XP:</strong> Every on-time save earns +50 XP. Prepaying advance cycles earns bonus XP!
              </span>
            </li>
          </ul>

          {active ? (
            <div className="mt-4 border-t border-line/60 pt-3 flex justify-between items-center">
              <span className="text-[11px] text-muted">Need to cancel this pot?</span>
              <button
                type="button"
                onClick={() => setCloseConfirmOpen(true)}
                className="text-xs font-bold text-danger hover:underline"
              >
                Close pot
              </button>
            </div>
          ) : null}
        </section>

        {/* Activity Feed */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[14px] font-black uppercase tracking-[0.12em] text-muted">Pot Activity</h2>
            <Link href="/wallet/history" className="text-xs font-bold text-muted hover:text-ink">
              All transactions
            </Link>
          </div>
          {history.length ? (
            <div className="space-y-1.5">
              {history.map((tx) => {
                const out = isMoneyOut(tx.kind);
                const isPenalty = tx.kind === "penalty";
                return (
                  <MoneyRow
                    key={tx.id}
                    href={txHref(tx.id)}
                    mark={isPenalty ? "!" : tx.kind === "savings_in" ? "↓" : "↑"}
                    title={
                      isPenalty
                        ? "Penalty fee"
                        : tx.kind === "savings_in"
                          ? "Saved into pot"
                          : "Returned to wallet"
                    }
                    meta={[
                      isPenalty ? "Missed or early break" : tx.kind === "savings_in" ? "Deposit" : "Withdrawal",
                      formatDate(tx.createdAt),
                    ].join(" · ")}
                    amount={`${out ? "−" : "+"}${formatXAF(tx.amount, { withCurrency: false })}`}
                    tone={out ? "out" : "in"}
                    badge={<StatusBadge status={tx.status} />}
                  />
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-muted ring-1 ring-line/80">
              No saves recorded yet. Save or prepay to kick off your streak!
            </p>
          )}
        </section>
      </div>

      {/* Prepay / Deposit Modal */}
      <SavingsDepositModal
        plan={plan}
        walletBalance={balance}
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => setDepositOpen(false)}
      />

      {/* Withdraw Modal with Early Break Alert */}
      <SavingsWithdrawModal
        plan={plan}
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={() => setWithdrawOpen(false)}
      />

      {/* Close Plan Confirmation */}
      <ConfirmSheet
        open={closeConfirmOpen}
        title="Close Savings Pot"
        subtitle={plan.name}
        amount={plan.balance}
        details={[
          { label: "Pot Balance", value: formatXAF(plan.balance) },
          { label: "Destination", value: "Your wallet" },
        ]}
        warning="This will close the pot and move any remaining balance back to your wallet."
        loading={act.isPending}
        error={pinError}
        lockedUntil={lockedUntil}
        confirmLabel="Enter PIN to close"
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={handleClosePlan}
      />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3.5 ring-1 ring-line/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
        <Icon className="h-3.5 w-3.5 text-brand" /> {label}
      </div>
      <p className="mt-1 text-base font-black tracking-tight text-ink sm:text-lg">{value}</p>
      <p className="truncate text-[11px] text-muted">{hint}</p>
    </div>
  );
}
