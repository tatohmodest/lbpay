"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, CalendarClock, Flame, Target, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { StatusBadge } from "@/components/ui/badge";
import { DueChip, ProgressRing, Streak } from "@/components/savings";
import { MoneyRow } from "@/components/money-hub";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useMe, useSavingsAction, useSavingsPlan } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import { SAVINGS, cyclesToTarget, estimatedFinishAt, frequencyEvery, penaltyFor, planProgress, timeUntil } from "@/lib/savings";
import { txHref } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

type Mode = "deposit" | "withdraw" | "close";

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
  const [mode, setMode] = useState<Mode | null>(null);
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const history = ((me.data?.transactions as Transaction[] | undefined) || []).filter((tx) => tx.meta?.planId === id).slice(0, 12);

  if (planQuery.isError && !plan) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line">This plan could not be found.</p>
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="h-40 animate-pulse rounded-[1.6rem] bg-white ring-1 ring-line/60" />
        <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-line/60" />
      </div>
    );
  }

  const progress = planProgress(plan);
  const left = cyclesToTarget(plan);
  const finish = estimatedFinishAt(plan);
  const value = mode === "deposit" ? Number(amount) || 0 : mode === "withdraw" ? Number(amount) || 0 : plan.balance;
  const active = plan.status === "active";
  const depositOk = mode === "deposit" && value >= SAVINGS.minAmount && value <= balance;
  const withdrawOk = mode === "withdraw" && value > 0 && value <= plan.balance;
  const ready = mode === "close" ? true : mode === "deposit" ? depositOk : withdrawOk;

  function start(next: Mode) {
    setMode(next);
    setAmount(next === "deposit" ? String(plan!.amount) : next === "withdraw" ? String(plan!.balance) : "");
    setPinError("");
  }

  async function confirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      if (mode === "deposit") {
        await act.mutateAsync({ action: "deposit", amount: value, pin });
        notify.moneyOut(value, `Saved into ${plan!.emoji} ${plan!.name}`);
      } else if (mode === "withdraw") {
        await act.mutateAsync({ action: "withdraw", amount: value, pin });
        notify.moneyIn(value, `Moved back to your wallet from ${plan!.name}`);
      } else {
        await act.mutateAsync({ action: "close", pin });
        notify.moneyIn(plan!.balance, `${plan!.name} closed · pot returned to wallet`);
        router.push("/wallet/savings");
      }
      setOpen(false);
      setMode(null);
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("That did not go through", fail.error);
    }
  }

  async function toggleAuto() {
    try {
      await act.mutateAsync({ action: "settings", autoSave: !plan!.autoSave });
      notify.info("Auto-save", plan!.autoSave ? "Turned off. Remember to save manually." : "Turned on. We will pull each save from your wallet.");
    } catch (err) {
      notify.error("Could not update", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        <div className="flex items-center gap-3">
          <Link href="/wallet/savings" className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line/80" aria-label="Back to savings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">
              {plan.emoji} {plan.name}
            </h1>
            <p className="text-sm text-muted">
              {formatXAF(plan.amount)} {frequencyEvery(plan.frequency)}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.6rem] bg-forest p-5 text-white">
          <div className="flex items-center gap-4">
            <span className="relative grid h-24 w-24 shrink-0 place-items-center text-brand">
              <ProgressRing value={progress} size={96} stroke={8} className="absolute inset-0" />
              <span className="text-center">
                <span className="block font-mono text-lg font-black leading-none text-white">{progress != null ? `${Math.round(progress * 100)}%` : "∞"}</span>
                <span className="block text-[10px] font-semibold text-hero-muted">{progress != null ? "of goal" : "open"}</span>
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-hero-muted">In this pot</p>
              <p className="font-mono text-[1.9rem] font-black leading-none tracking-tight">
                {formatXAF(plan.balance, { withCurrency: false })} <span className="text-sm font-bold text-hero-muted">XAF</span>
              </p>
              {plan.target ? <p className="mt-1 text-xs text-hero-muted">Goal {formatXAF(plan.target)}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DueChip plan={plan} />
                <Streak count={plan.streak} className="text-amber-300" />
              </div>
            </div>
          </div>

          {active ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => start("deposit")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
              >
                <ArrowDownToLine className="h-4 w-4" /> Save now
              </button>
              <button
                type="button"
                onClick={() => start("withdraw")}
                disabled={!plan.balance}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/15 disabled:opacity-50"
              >
                <ArrowUpFromLine className="h-4 w-4" /> Withdraw
              </button>
            </div>
          ) : plan.status === "completed" ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <Trophy className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold">Goal reached. Move the pot to your wallet when you are ready.</p>
              <button type="button" onClick={() => start("close")} className="ml-auto shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-forest">
                Collect
              </button>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-2.5">
          <Stat icon={CalendarClock} label="Next save" value={active ? timeUntil(plan.nextDueAt) : "—"} hint={active ? formatDate(plan.nextDueAt) : plan.status} />
          <Stat icon={Target} label="Left to goal" value={left != null ? `${left} saves` : "Open"} hint={finish ? `≈ ${formatDate(finish)}` : "No end date"} />
          <Stat icon={Flame} label="Best streak" value={String(plan.bestStreak)} hint={`${plan.missed} missed`} />
          <Stat icon={Zap} label="Penalty" value={`${Math.round(plan.penaltyRate * 100)}%`} hint={plan.penalties ? `${formatXAF(penaltyFor(plan), { withCurrency: false })}/miss · ${formatXAF(plan.penalties, { withCurrency: false })} paid` : `${formatXAF(penaltyFor(plan))} per miss`} />
        </section>

        {active ? (
          <button
            type="button"
            onClick={toggleAuto}
            disabled={act.isPending}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-line/80 hover:ring-brand/40"
          >
            <span className={cn("grid h-10 w-10 place-items-center rounded-xl", plan.autoSave ? "bg-brand-soft text-brand-deep" : "bg-[#eef1ef] text-muted")}>
              <Zap className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-ink">Auto-save {plan.autoSave ? "on" : "off"}</span>
              <span className="block text-xs text-muted">
                {plan.autoSave ? `We pull ${formatXAF(plan.amount)} from your wallet when each save is due.` : "Tap to let us move each save automatically."}
              </span>
            </span>
            <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", plan.autoSave ? "bg-brand" : "bg-line")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", plan.autoSave ? "left-[1.375rem]" : "left-0.5")} />
            </span>
          </button>
        ) : null}
      </div>

      <div className="space-y-5 lg:col-span-7">
        {mode && mode !== "close" ? (
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">{mode === "deposit" ? "Save into this pot" : "Move back to wallet"}</h2>
              <button type="button" onClick={() => setMode(null)} className="text-sm font-bold text-muted hover:text-ink">
                Cancel
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ready) return;
                setOpen(true);
              }}
            >
              <p className="text-sm text-muted">
                {mode === "deposit" ? `Wallet ${formatXAF(balance)}` : `Pot ${formatXAF(plan.balance)}`}
              </p>
              <Field label="Amount (XAF)" hint={mode === "deposit" ? `Saving at least ${formatXAF(plan.amount)} clears the current cycle and grows your streak.` : "No fee. Your streak is kept."}>
                <Input type="number" inputMode="numeric" min={mode === "deposit" ? SAVINGS.minAmount : 1} className="font-mono text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </Field>
              {mode === "deposit" ? (
                <div className="flex flex-wrap gap-2">
                  {[plan.amount, plan.amount * 2, plan.amount * 5].map((preset) => (
                    <button key={preset} type="button" onClick={() => setAmount(String(preset))} className="rounded-full bg-paper px-3 py-1.5 text-sm font-bold text-ink hover:bg-brand-soft">
                      {formatXAF(preset, { withCurrency: false })}
                    </button>
                  ))}
                </div>
              ) : (
                <button type="button" onClick={() => setAmount(String(plan.balance))} className="rounded-full bg-paper px-3 py-1.5 text-sm font-bold text-ink hover:bg-brand-soft">
                  Everything
                </button>
              )}
              {mode === "deposit" && value > balance ? <p className="text-sm font-semibold text-danger">Insufficient wallet balance. Add money or save a smaller amount.</p> : null}
              {mode === "withdraw" && value > plan.balance ? <p className="text-sm font-semibold text-danger">That is more than the pot holds.</p> : null}
              <Button type="submit" disabled={!ready}>
                Review and confirm
              </Button>
            </form>
          </Card>
        ) : null}

        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[15px] font-bold text-ink">Plan activity</h2>
            <Link href="/wallet/history" className="text-xs font-bold text-muted hover:text-ink">
              View more
            </Link>
          </div>
          {history.length ? (
            history.map((tx) => {
              const out = isMoneyOut(tx.kind);
              return (
                <MoneyRow
                  key={tx.id}
                  href={txHref(tx.id)}
                  mark={tx.kind === "penalty" ? "!" : plan.emoji}
                  title={tx.kind === "penalty" ? "Missed-save penalty" : tx.kind === "savings_in" ? "Saved" : "Withdrawn"}
                  meta={[tx.kind === "penalty" ? "Missed cycle" : tx.kind === "savings_out" ? "To wallet" : "From wallet", formatDate(tx.createdAt)].join(" · ")}
                  amount={`${out ? "−" : "+"}${formatXAF(tx.amount, { withCurrency: false })}`}
                  tone={out ? "out" : "in"}
                  badge={<StatusBadge status={tx.status} />}
                />
              );
            })
          ) : (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-muted ring-1 ring-line/80">No saves yet. Your first one is due in {timeUntil(plan.nextDueAt)}.</p>
          )}
        </section>

        {active ? (
          <section className="rounded-2xl bg-white p-4 ring-1 ring-line/80">
            <p className="text-sm font-black text-ink">How this plan works</p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              <li>• Every {plan.frequency === "daily" ? "day" : plan.frequency === "weekly" ? "week" : "month"} a save of {formatXAF(plan.amount)} falls due.</li>
              <li>• {plan.autoSave ? "Auto-save pulls it from your wallet. If the wallet is short, the cycle counts as missed." : "You save manually from this page or the wallet home."}</li>
              <li>• A missed cycle cuts {Math.round(plan.penaltyRate * 100)}% ({formatXAF(penaltyFor(plan))}) from your wallet, or from the pot if the wallet is empty.</li>
              <li>• Withdraw any time with no fee. Closing the plan returns the whole pot to your wallet.</li>
            </ul>
            <button type="button" onClick={() => start("close")} className="mt-3 text-xs font-bold text-danger hover:underline">
              Close this plan
            </button>
          </section>
        ) : null}
      </div>

      <ConfirmSheet
        open={open || mode === "close"}
        title={mode === "deposit" ? "Confirm save" : mode === "withdraw" ? "Confirm withdrawal" : "Close plan"}
        subtitle={`${plan.emoji} ${plan.name}`}
        amount={value}
        details={
          mode === "deposit"
            ? [
                { label: "Into pot", value: formatXAF(value) },
                { label: "Pot after", value: formatXAF(plan.balance + value) },
                { label: "Wallet after", value: formatXAF(balance - value) },
                { label: "Fee", value: "None" },
              ]
            : [
                { label: "Back to wallet", value: formatXAF(value) },
                { label: "Pot after", value: formatXAF(plan.balance - value) },
                { label: "Fee", value: "None" },
              ]
        }
        warning={mode === "close" ? "The plan ends and everything in the pot returns to your wallet." : undefined}
        loading={act.isPending}
        error={pinError}
        lockedUntil={lockedUntil}
        confirmLabel={mode === "deposit" ? "Enter PIN to save" : "Enter PIN to confirm"}
        onClose={() => {
          setOpen(false);
          if (mode === "close") setMode(null);
        }}
        onConfirm={confirm}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Target; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 ring-1 ring-line/80">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-lg font-black tracking-tight text-ink">{value}</p>
      <p className="truncate text-[11px] text-muted">{hint}</p>
    </div>
  );
}
