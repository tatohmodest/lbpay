"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlarmClock, Check, Flame, Lock, PiggyBank, Plus, Zap } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";
import { useCreateSavingsPlan } from "@/lib/hooks/wallet";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import {
  FREQUENCIES,
  PLAN_EMOJIS,
  SAVINGS,
  cyclesPerMonth,
  dueState,
  frequencyEvery,
  frequencyLabel,
  monthlyPace,
  penaltyFor,
  planProgress,
  timeUntil,
  validatePlanInput,
} from "@/lib/savings";
import type { SavingsFrequency, SavingsPlan } from "@/lib/types";

/* ---------- small pieces ---------- */

export function ProgressRing({ value, size = 56, stroke = 6, className }: { value: number | null; size?: number; stroke?: number; className?: string }) {
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
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-deep", className)}>
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
        ? "bg-amber-50 text-amber-700"
        : "bg-[#eef1ef] text-muted";
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
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12px] font-bold", count ? "text-amber-600" : "text-muted", className)}>
      <Flame className={cn("h-3.5 w-3.5", count ? "fill-amber-400 text-amber-500" : "")} />
      {count} streak
    </span>
  );
}

/* ---------- plan card ---------- */

export function PlanCard({ plan, compact = false }: { plan: SavingsPlan; compact?: boolean }) {
  const progress = planProgress(plan);
  const state = dueState(plan);
  const urgent = state === "overdue" || state === "today";
  return (
    <Link
      href={`/wallet/savings/${encodeURIComponent(plan.id)}`}
      className={cn(
        "group block rounded-2xl bg-white p-4 ring-1 transition hover:ring-brand/40",
        urgent && plan.status === "active" ? "ring-amber-200" : "ring-line/80",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="relative grid h-14 w-14 shrink-0 place-items-center text-brand">
          <ProgressRing value={progress} size={56} stroke={5} className="absolute inset-0" />
          <span className="text-xl leading-none">{plan.emoji}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-black text-ink">{plan.name}</p>
            {plan.autoSave ? <Zap className="h-3.5 w-3.5 shrink-0 text-brand" aria-label="Auto-save on" /> : null}
          </div>
          <p className="truncate text-xs text-muted">
            {formatXAF(plan.amount, { withCurrency: false })}
            {plan.frequency === "daily" ? "/day" : plan.frequency === "weekly" ? "/week" : "/month"}
            {plan.target ? ` · of ${formatXAF(plan.target, { withCurrency: false })}` : " · no goal"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DueChip plan={plan} />
            <Streak count={plan.streak} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-black text-ink">{formatXAF(plan.balance, { withCurrency: false })}</p>
          <p className="text-[11px] text-muted">{progress != null ? `${Math.round(progress * 100)}%` : "saved"}</p>
        </div>
      </div>
      {!compact && plan.status === "active" ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-[12px]">
          <span className="text-muted">
            Miss a {plan.frequency} save and <span className="font-bold text-ink">{formatXAF(penaltyFor(plan))}</span> is cut.
          </span>
          <span className="font-bold text-brand-deep group-hover:underline">Save now</span>
        </div>
      ) : null}
    </Link>
  );
}

/* ---------- create plan ---------- */

const PRESETS: Array<{ name: string; emoji: string; frequency: SavingsFrequency; amount: number; target: number | null }> = [
  { name: "Daily 500", emoji: "🎯", frequency: "daily", amount: 500, target: 15_000 },
  { name: "Rent", emoji: "🏠", frequency: "weekly", amount: 10_000, target: 120_000 },
  { name: "School fees", emoji: "🎓", frequency: "monthly", amount: 25_000, target: 150_000 },
  { name: "New phone", emoji: "📱", frequency: "weekly", amount: 5_000, target: 200_000 },
];

export function NewPlanForm({ onCreated, balance }: { onCreated?: (plan: SavingsPlan) => void; balance: number }) {
  const notify = useNotify();
  const create = useCreateSavingsPlan();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(PLAN_EMOJIS[0]);
  const [frequency, setFrequency] = useState<SavingsFrequency>("daily");
  const [amount, setAmount] = useState("500");
  const [target, setTarget] = useState("");
  const [penalty, setPenalty] = useState(Math.round(SAVINGS.defaultPenaltyRate * 100));
  const [autoSave, setAutoSave] = useState(true);
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const value = Number(amount) || 0;
  const goal = Number(target) || 0;
  const input = { name, emoji, frequency, amount: value, target: goal || null, penaltyRate: penalty / 100, autoSave };
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

  async function confirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      const res = await create.mutateAsync({ ...input, pin });
      notify.success("Plan created", `${emoji} ${name} · ${formatXAF(value)} ${frequencyEvery(frequency)}.`);
      setOpen(false);
      onCreated?.(res.plan);
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not create plan", fail.error);
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (issue) return;
        setPinError("");
        setOpen(true);
      }}
    >
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Start from a template</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setName(preset.name);
                setEmoji(preset.emoji);
                setFrequency(preset.frequency);
                setAmount(String(preset.amount));
                setTarget(preset.target ? String(preset.target) : "");
              }}
              className="shrink-0 rounded-full bg-paper px-3 py-1.5 text-sm font-bold text-ink ring-1 ring-transparent hover:ring-brand/40"
            >
              {preset.emoji} {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Icon</span>
          <div className="grid h-[3.25rem] w-[3.25rem] place-items-center rounded-2xl bg-paper text-2xl">{emoji}</div>
        </div>
        <Field label="Plan name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent, School fees, Trip" maxLength={40} required />
        </Field>
      </div>
      <div className="-mt-2 flex flex-wrap gap-1.5">
        {PLAN_EMOJIS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setEmoji(item)}
            className={cn("grid h-9 w-9 place-items-center rounded-xl text-lg", emoji === item ? "bg-brand-soft ring-2 ring-brand" : "bg-paper")}
            aria-label={`Use ${item}`}
          >
            {item}
          </button>
        ))}
      </div>

      <Field label="How often">
        <div className="grid grid-cols-3 gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-semibold",
                frequency === f.value ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink",
              )}
            >
              {f.label}
              <span className="mt-0.5 block text-[10px] font-medium text-muted">{f.every}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Amount ${frequencyEvery(frequency)} (XAF)`} hint={value ? `≈ ${formatXAF(pace)} a month` : undefined}>
          <Input type="number" inputMode="numeric" min={SAVINGS.minAmount} className="font-mono text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Goal (optional)" hint={cycles ? `${cycles} saves · ${finishLabel}` : "Leave empty to save with no end"}>
          <Input type="number" inputMode="numeric" className="font-mono text-lg" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
        </Field>
      </div>

      <div className="rounded-2xl bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-ink">Miss-a-save penalty</p>
            <p className="text-xs text-muted">Cut from your wallet each time a {frequency} save is missed.</p>
          </div>
          <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-sm font-black text-ink ring-1 ring-line">{penalty}%</span>
        </div>
        <input
          type="range"
          min={Math.round(SAVINGS.minPenaltyRate * 100)}
          max={Math.round(SAVINGS.maxPenaltyRate * 100)}
          step={1}
          value={penalty}
          onChange={(e) => setPenalty(Number(e.target.value))}
          className="mt-3 w-full accent-brand"
          aria-label="Penalty percentage"
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>1% · gentle</span>
          <span>{value ? `${formatXAF(penaltyAmount)} per miss` : ""}</span>
          <span>10% · strict</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
        <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-black text-ink">
            <Zap className="h-4 w-4 text-brand" /> Auto-save from wallet
          </span>
          <span className="block text-xs text-muted">
            When a save falls due we move {value ? formatXAF(value) : "the amount"} from your wallet automatically. If the wallet is short, the penalty applies instead.
          </span>
        </span>
      </label>

      {name && issue ? <p className="text-sm font-semibold text-danger">{issue}</p> : null}
      {value > balance ? <p className="text-xs text-muted">Heads-up: your wallet ({formatXAF(balance)}) holds less than one save right now.</p> : null}

      <Button type="submit" disabled={Boolean(issue)}>
        <Plus className="h-4 w-4" /> Create plan
      </Button>

      <ConfirmSheet
        open={open}
        title="Confirm savings plan"
        subtitle={`${emoji} ${name} · ${frequencyLabel(frequency)}`}
        amount={value}
        details={[
          { label: "Save", value: `${formatXAF(value)} ${frequencyEvery(frequency)}` },
          { label: "Goal", value: goal ? formatXAF(goal) : "Open-ended" },
          { label: "Penalty per miss", value: `${penalty}% · ${formatXAF(penaltyAmount)}` },
          { label: "Auto-save", value: autoSave ? "On" : "Off" },
        ]}
        warning="No money moves now. Your first save is due at the end of the first cycle."
        loading={create.isPending}
        error={pinError}
        lockedUntil={lockedUntil}
        confirmLabel="Enter PIN to create"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </form>
  );
}

/* ---------- empty state ---------- */

export function SavingsEmpty({ href = "/wallet/savings?new=1" }: { href?: string }) {
  return (
    <Link href={href} className="relative block overflow-hidden rounded-2xl bg-forest p-5 text-white ring-1 ring-white/10">
      <Image
        src="/illustrations/savings-pot.webp"
        alt=""
        aria-hidden
        width={512}
        height={512}
        className="pointer-events-none absolute -right-6 -top-4 h-40 w-40 object-cover opacity-90 sm:h-48 sm:w-48"
      />
      <div className="relative flex items-start gap-4 pr-24 sm:pr-32">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white">
          <PiggyBank className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Start saving</p>
          <p className="mt-1 text-lg font-black leading-tight">500 XAF a day becomes 15,000 XAF this month.</p>
          <p className="mt-1 text-sm text-hero-muted">Pick daily, weekly or monthly. Miss a save and a small penalty you choose keeps you honest.</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-forest">
            <Lock className="h-3.5 w-3.5" /> Create my first plan
          </span>
        </div>
      </div>
    </Link>
  );
}
