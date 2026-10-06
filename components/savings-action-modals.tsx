"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Flame,
  Lock,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PlanIcon } from "@/components/plan-icon";
import { formatDate, formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";
import { useSavingsAction } from "@/lib/hooks/wallet";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import {
  SAVINGS,
  calculateAdvanceCoverage,
  earlyWithdrawalPenalty,
  frequencyEvery,
  isObjectiveMet,
} from "@/lib/savings";
import type { SavingsPlan } from "@/lib/types";

/* ------------------- DEPOSIT / PREPAY MODAL ------------------- */

export function SavingsDepositModal({
  plan,
  walletBalance,
  open,
  onClose,
  onSuccess,
}: {
  plan: SavingsPlan;
  walletBalance: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const notify = useNotify();
  const act = useSavingsAction(plan.id);

  const [amount, setAmount] = useState(String(plan.amount));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const value = Number(amount) || 0;
  const cycleUnit = plan.frequency === "daily" ? "day" : plan.frequency === "weekly" ? "week" : "month";
  const cycleUnitPlural = plan.frequency === "daily" ? "days" : plan.frequency === "weekly" ? "weeks" : "months";

  const { cycles, nextDueAt, surplus, points } = useMemo(() => {
    return calculateAdvanceCoverage(value, plan.amount, plan.frequency, plan.nextDueAt);
  }, [value, plan.amount, plan.frequency, plan.nextDueAt]);

  const isValid = value >= SAVINGS.minAmount && value <= walletBalance;

  // Preset prepayment multiples
  const presets = [
    { label: `1 ${cycleUnit}`, cycles: 1, val: plan.amount },
    { label: `2 ${cycleUnitPlural}`, cycles: 2, val: plan.amount * 2 },
    { label: `4 ${cycleUnitPlural}`, cycles: 4, val: plan.amount * 4 },
    { label: `7 ${cycleUnitPlural}`, cycles: 7, val: plan.amount * 7 },
  ];

  if (!open) return null;

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      await act.mutateAsync({ action: "deposit", amount: value, pin });
      if (cycles > 1) {
        notify.success(
          "Prepaid successfully",
          `Covered ${cycles} ${cycleUnitPlural} in advance. You're protected until ${formatDate(nextDueAt)}.`,
        );
      } else {
        notify.moneyOut(value, `Saved into ${plan.name} · streak +1`);
      }
      setConfirmOpen(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not save", fail.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/60 pb-4">
          <div className="flex items-center gap-3">
            <PlanIcon icon={plan.icon || plan.emoji} size="lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Deposit & Prepay</p>
              <h2 className="text-xl font-black text-ink sm:text-2xl">Save into {plan.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-muted transition hover:bg-line/60 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="mt-5 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;
            setPinError("");
            setConfirmOpen(true);
          }}
        >
          {/* Prepay Quick Multiple Chips */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Prepay cycles in advance
              </span>
              <span className="text-xs font-semibold text-muted">Wallet: {formatXAF(walletBalance)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((preset) => {
                const isSelected = value === preset.val;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAmount(String(preset.val))}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl p-2.5 text-center transition border",
                      isSelected
                        ? "border-brand bg-brand-soft text-brand-dark ring-1 ring-brand font-black"
                        : "border-line bg-paper text-ink font-bold hover:bg-line/40",
                    )}
                  >
                    <span className="text-xs">{preset.label}</span>
                    <span className="text-[11px] font-mono text-muted mt-0.5">{formatXAF(preset.val, { withCurrency: false })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <Field
            label="Deposit Amount (XAF)"
            hint={`Cycle rate: ${formatXAF(plan.amount)} ${frequencyEvery(plan.frequency)}`}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={SAVINGS.minAmount}
              className="font-mono text-xl font-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>

          {/* Real-time Advance Protection Banner */}
          {cycles >= 1 ? (
            <div className="rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50/80 p-4 border border-emerald-200/80">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  {cycles > 1 ? <Shield className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-950">
                      {cycles > 1
                        ? `Covers ${cycles} ${cycleUnitPlural} in advance!`
                        : `Covers current ${cycleUnit} save!`}
                    </span>
                    <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      +{points} XP
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                    {cycles > 1 ? (
                      <>
                        <strong>Streak Shield Active:</strong> Your next save won&apos;t be due until{" "}
                        <strong className="underline">{formatDate(nextDueAt)}</strong>. You are protected from missed-save
                        penalties during this time!
                      </>
                    ) : (
                      <>Keeps your streak alive and pushes your next due date to {formatDate(nextDueAt)}.</>
                    )}
                  </p>
                  {surplus > 0 ? (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                      +{formatXAF(surplus)} surplus remains in the pot towards the next cycle.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : value > 0 ? (
            <div className="rounded-2xl bg-paper p-3 text-xs text-muted">
              Saving less than {formatXAF(plan.amount)} will top up the pot balance, but does not advance the due date or
              streak.
            </div>
          ) : null}

          {value > walletBalance ? (
            <p className="text-xs font-semibold text-danger">
              Insufficient wallet balance ({formatXAF(walletBalance)}). Top up your wallet first.
            </p>
          ) : null}

          <Button type="submit" disabled={!isValid} className="h-12 w-full text-base font-bold shadow-lg">
            <ArrowDownToLine className="h-4 w-4 mr-1.5" /> Continue to Confirm
          </Button>
        </form>

        <ConfirmSheet
          open={confirmOpen}
          title="Confirm Save"
          subtitle={`${plan.name} · ${cycles} ${cycles === 1 ? cycleUnit : cycleUnitPlural} prepaid`}
          amount={value}
          details={[
            { label: "Amount", value: formatXAF(value) },
            { label: "Cycles Covered", value: `${cycles} ${cycles === 1 ? cycleUnit : cycleUnitPlural}` },
            { label: "Protected Until", value: formatDate(nextDueAt) },
            { label: "Saver XP", value: `+${points} Points` },
          ]}
          loading={act.isPending}
          error={pinError}
          lockedUntil={lockedUntil}
          confirmLabel="Enter PIN to save"
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

/* ------------------- WITHDRAW / EARLY PENALTY MODAL ------------------- */

export function SavingsWithdrawModal({
  plan,
  open,
  onClose,
  onSuccess,
}: {
  plan: SavingsPlan;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const notify = useNotify();
  const act = useSavingsAction(plan.id);

  const [amount, setAmount] = useState(String(plan.balance));
  const [agreedToEarlyPenalty, setAgreedToEarlyPenalty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const value = Number(amount) || 0;
  const met = isObjectiveMet(plan);
  const earlyPenalty = !met && plan.target && plan.target > 0 ? earlyWithdrawalPenalty(plan, value) : 0;
  const netReturned = Math.max(0, value - earlyPenalty);
  const isAll = value === plan.balance;

  const isValid = value > 0 && value <= plan.balance && (met || earlyPenalty === 0 || agreedToEarlyPenalty);

  if (!open) return null;

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      await act.mutateAsync({
        action: "withdraw",
        amount: isAll ? "all" : value,
        pin,
        breakPenaltyAgreed: agreedToEarlyPenalty,
      });

      if (earlyPenalty > 0) {
        notify.info(
          "Early withdrawal processed",
          `Returned ${formatXAF(netReturned)} to wallet. ${formatXAF(earlyPenalty)} early break fee deducted.`,
        );
      } else {
        notify.moneyIn(value, `Moved back to wallet with 0% fees!`);
      }

      setConfirmOpen(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not withdraw", fail.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/60 pb-4">
          <div className="flex items-center gap-3">
            <PlanIcon icon={plan.icon || plan.emoji} size="lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Withdraw from pot</p>
              <h2 className="text-xl font-black text-ink sm:text-2xl">Return to wallet</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-muted transition hover:bg-line/60 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="mt-5 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;
            setPinError("");
            setConfirmOpen(true);
          }}
        >
          {/* Pot balance info */}
          <div className="flex items-center justify-between rounded-2xl bg-paper p-3.5">
            <div>
              <p className="text-xs text-muted">Available in pot</p>
              <p className="font-mono text-lg font-black text-ink">{formatXAF(plan.balance)}</p>
            </div>
            {plan.target ? (
              <div className="text-right">
                <p className="text-xs text-muted">Objective Goal</p>
                <p className="font-mono text-sm font-bold text-ink">{formatXAF(plan.target)}</p>
              </div>
            ) : null}
          </div>

          {/* Amount input */}
          <Field label="Withdrawal Amount (XAF)">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={plan.balance}
              className="font-mono text-xl font-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>

          <div className="flex gap-2">
            {[plan.balance * 0.25, plan.balance * 0.5, plan.balance].map((pct, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAmount(String(Math.round(pct)))}
                className="flex-1 rounded-xl bg-paper py-2 text-xs font-bold text-ink hover:bg-line/40 transition"
              >
                {i === 2 ? "All (100%)" : `${(i + 1) * 25}%`}
              </button>
            ))}
          </div>

          {/* Objective Check & Penalty Callout */}
          {met ? (
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200/80">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-emerald-950">Goal Objective Met! 0% Fees</p>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    Congratulations! You reached your savings target. All funds transfer to your wallet with zero
                    penalties.
                  </p>
                </div>
              </div>
            </div>
          ) : earlyPenalty > 0 ? (
            <div className="rounded-2xl bg-rose-50/90 p-4 border border-rose-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-rose-950">Early Break Penalty Warning</p>
                  <p className="mt-1 text-xs text-rose-900 leading-relaxed">
                    Your goal of <strong>{formatXAF(plan.target || 0)}</strong> is not yet met. As pledged when creating this
                    pot, an early withdrawal fee of <strong>{Math.round(plan.penaltyRate * 100)}%</strong> applies:
                  </p>
                  <div className="mt-3 space-y-1.5 rounded-xl bg-white/80 p-3 text-xs font-mono">
                    <div className="flex justify-between text-muted">
                      <span>Requested withdrawal:</span>
                      <span>{formatXAF(value)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>Early break fee ({Math.round(plan.penaltyRate * 100)}%):</span>
                      <span>−{formatXAF(earlyPenalty)}</span>
                    </div>
                    <div className="flex justify-between border-t border-line/60 pt-1 font-black text-ink">
                      <span>Net credited to wallet:</span>
                      <span>{formatXAF(netReturned)}</span>
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreedToEarlyPenalty}
                      onChange={(e) => setAgreedToEarlyPenalty(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-rose-600 rounded"
                      required
                    />
                    <span className="text-xs font-bold text-rose-950">
                      I agree to forfeit the {formatXAF(earlyPenalty)} penalty to withdraw early before reaching my goal.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {value > plan.balance ? (
            <p className="text-xs font-semibold text-danger">That is more than the pot holds ({formatXAF(plan.balance)}).</p>
          ) : null}

          <Button type="submit" disabled={!isValid} className="h-12 w-full text-base font-bold shadow-lg">
            <ArrowUpFromLine className="h-4 w-4 mr-1.5" /> Review Withdrawal
          </Button>
        </form>

        <ConfirmSheet
          open={confirmOpen}
          title="Confirm Withdrawal"
          subtitle={plan.name}
          amount={netReturned}
          details={[
            { label: "Pot Debit", value: formatXAF(value) },
            { label: "Early Penalty", value: earlyPenalty > 0 ? `−${formatXAF(earlyPenalty)}` : "None (0%)" },
            { label: "Wallet Credit", value: formatXAF(netReturned) },
          ]}
          loading={act.isPending}
          error={pinError}
          lockedUntil={lockedUntil}
          confirmLabel="Enter PIN to withdraw"
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
