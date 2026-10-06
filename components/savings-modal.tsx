"use client";

import { useId, useMemo, useState } from "react";
import { Lock, Plus, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PlanIcon, PLAN_ICON_OPTIONS } from "@/components/plan-icon";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";
import { useCreateSavingsPlan } from "@/lib/hooks/wallet";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import {
  FREQUENCIES,
  SAVINGS,
  cyclesPerMonth,
  frequencyEvery,
  frequencyLabel,
  monthlyPace,
  penaltyFor,
  validatePlanInput,
} from "@/lib/savings";
import type { SavingsFrequency, SavingsPlan } from "@/lib/types";

const TEMPLATES: Array<{
  name: string;
  icon: string;
  frequency: SavingsFrequency;
  amount: number;
  target: number | null;
}> = [
  { name: "Daily Habit", icon: "target", frequency: "daily", amount: 500, target: 15_000 },
  { name: "House Rent", icon: "home", frequency: "weekly", amount: 10_000, target: 120_000 },
  { name: "School Fees", icon: "graduation", frequency: "monthly", amount: 25_000, target: 150_000 },
  { name: "Emergency Shield", icon: "shield", frequency: "weekly", amount: 5_000, target: 100_000 },
  { name: "Gadget Fund", icon: "smartphone", frequency: "daily", amount: 1_000, target: 50_000 },
  { name: "Business Capital", icon: "briefcase", frequency: "weekly", amount: 15_000, target: 300_000 },
];

export function SavingsModal({
  open,
  onClose,
  onCreated,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (plan: SavingsPlan) => void;
  balance: number;
}) {
  const notify = useNotify();
  const create = useCreateSavingsPlan();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PLAN_ICON_OPTIONS[0].id);
  const [frequency, setFrequency] = useState<SavingsFrequency>("daily");
  const [amount, setAmount] = useState("500");
  const [target, setTarget] = useState("");
  const [penalty, setPenalty] = useState(Math.round(SAVINGS.defaultPenaltyRate * 100));
  const [autoSave, setAutoSave] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const value = Number(amount) || 0;
  const goal = Number(target) || 0;
  const input = {
    name,
    icon,
    emoji: "🎯",
    frequency,
    amount: value,
    target: goal || null,
    penaltyRate: penalty / 100,
    autoSave,
  };
  const issue = validatePlanInput(input);
  const pace = monthlyPace({ amount: value, frequency });
  const cycles = goal && value ? Math.ceil(goal / value) : 0;
  const penaltyAmount = penaltyFor({ amount: value, penaltyRate: penalty / 100 });

  const finishLabel = useMemo(() => {
    if (!cycles) return "";
    const perMonth = cyclesPerMonth(frequency);
    const months = cycles / perMonth;
    if (months < 1) return `${cycles} ${frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : "months"}`;
    return `about ${Math.round(months * 10) / 10} month${months >= 1.5 ? "s" : ""}`;
  }, [cycles, frequency]);

  if (!open) return null;

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      const res = await create.mutateAsync({ ...input, pin });
      notify.success("Savings pot created", `${name} · ${formatXAF(value)} ${frequencyEvery(frequency)}.`);
      setConfirmOpen(false);
      onClose();
      onCreated?.(res.plan);
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not create pot", fail.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line/60 pb-4">
          <div className="flex items-center gap-3">
            <PlanIcon icon={icon} size="lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Discipline Pot</p>
              <h2 id="modal-title" className="text-xl font-black text-ink sm:text-2xl">
                Create Savings Pot
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-muted transition hover:bg-line/60 hover:text-ink"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="mt-5 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (issue) return;
            setPinError("");
            setConfirmOpen(true);
          }}
        >
          {/* Quick presets */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Quick templates</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => {
                    setName(tmpl.name);
                    setIcon(tmpl.icon);
                    setFrequency(tmpl.frequency);
                    setAmount(String(tmpl.amount));
                    setTarget(tmpl.target ? String(tmpl.target) : "");
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-brand-soft hover:text-brand-dark"
                >
                  <PlanIcon icon={tmpl.icon} size="sm" className="h-5 w-5 rounded-md" />
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector (Clean Lucide Icons) */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Select an icon</p>
            <div className="grid grid-cols-6 gap-2">
              {PLAN_ICON_OPTIONS.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl p-2 transition",
                      isSelected ? "bg-brand-soft ring-2 ring-brand" : "bg-paper hover:bg-paper/80",
                    )}
                    aria-label={item.label}
                  >
                    <PlanIcon icon={item.id} size="sm" />
                    <span className="mt-1 text-[9px] font-bold leading-tight text-muted truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <Field label="Pot Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dream Trip, Rent 2026, New Laptop"
              maxLength={40}
              required
            />
          </Field>

          {/* Frequency Selector */}
          <Field label="Savings Rhythm">
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition",
                    frequency === f.value
                      ? "border-brand bg-brand-soft/60 text-brand-dark ring-1 ring-brand font-black"
                      : "border-line bg-white text-ink font-bold hover:bg-paper",
                  )}
                >
                  <span className="text-sm font-black">{f.label}</span>
                  <span className="mt-0.5 text-[10px] font-semibold text-muted">{f.every}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Amount & Target */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={`Amount ${frequencyEvery(frequency)} (XAF)`}
              hint={value ? `≈ ${formatXAF(pace)}/mo` : undefined}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={SAVINGS.minAmount}
                className="font-mono text-lg font-black"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>

            <Field
              label="Goal Objective (XAF)"
              hint={cycles ? `${cycles} saves · ${finishLabel}` : "Leave blank for open-ended"}
            >
              <Input
                type="number"
                inputMode="numeric"
                className="font-mono text-lg font-black"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Optional goal"
              />
            </Field>
          </div>

          {/* Locked Objective Notice */}
          {goal ? (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/70 p-3 text-amber-900 border border-amber-200/60">
              <Lock className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Locked Objective Commitment:</span>
                Once created, your goal of <span className="font-mono font-bold">{formatXAF(goal)}</span> cannot be
                lowered or cancelled. You can only withdraw early by paying your chosen penalty fee.
              </div>
            </div>
          ) : null}

          {/* Penalty Fee Selector */}
          <div className="rounded-2xl bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">Early break & miss penalty</p>
                <p className="text-xs text-muted">
                  Deducted if you withdraw before meeting your objective or miss a cycle.
                </p>
              </div>
              <span className="rounded-xl bg-white px-3 py-1 font-mono text-sm font-black text-brand-dark ring-1 ring-line">
                {penalty}%
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {[5, 10, 15, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setPenalty(rate)}
                  className={cn(
                    "flex-1 rounded-xl py-1.5 text-xs font-bold transition",
                    penalty === rate ? "bg-brand text-white shadow-sm" : "bg-white text-ink hover:bg-line/40 ring-1 ring-line",
                  )}
                >
                  {rate}%
                </button>
              ))}
            </div>

            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={penalty}
              onChange={(e) => setPenalty(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
              aria-label="Penalty percentage"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>1% · Gentle</span>
              <span>{value ? `${formatXAF(penaltyAmount)} per miss` : ""}</span>
              <span>25% · Iron Will</span>
            </div>
          </div>

          {/* Auto-save Toggle */}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-3.5 hover:bg-paper/50 transition">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="mt-1 h-4 w-4 accent-brand rounded"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-black text-ink">
                <Zap className="h-4 w-4 text-brand" /> Auto-save from wallet
              </span>
              <span className="block text-xs text-muted mt-0.5">
                Automatically saves {value ? formatXAF(value) : "the amount"} when each cycle is due. If your wallet is short,
                the penalty applies.
              </span>
            </span>
          </label>

          {/* Gamification Bonus Teaser */}
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>+25 Saver XP Welcome Points will be credited on creation!</span>
          </div>

          {name && issue ? <p className="text-sm font-semibold text-danger">{issue}</p> : null}

          <Button type="submit" disabled={Boolean(issue)} className="h-12 text-base font-bold shadow-lg">
            <Plus className="h-4 w-4 mr-1" /> Create Pot
          </Button>
        </form>

        <ConfirmSheet
          open={confirmOpen}
          title="Confirm savings pot"
          subtitle={`${name} · ${frequencyLabel(frequency)}`}
          amount={value}
          details={[
            { label: "Cycle Save", value: `${formatXAF(value)} ${frequencyEvery(frequency)}` },
            { label: "Objective", value: goal ? formatXAF(goal) : "Open-ended" },
            { label: "Commitment Penalty", value: `${penalty}% (${formatXAF(penaltyAmount)})` },
            { label: "Auto-save", value: autoSave ? "Enabled" : "Manual" },
          ]}
          warning="No money moves right now. Your first save will be due at the end of the first cycle."
          loading={create.isPending}
          error={pinError}
          lockedUntil={lockedUntil}
          confirmLabel="Enter PIN to create pot"
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
