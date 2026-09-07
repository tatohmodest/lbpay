"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { AlarmClock, ArrowRight, Check, Eye, EyeOff, Flame, PiggyBank, Plus, Zap } from "lucide-react";
import { useHiddenAmount } from "@/components/house-card";
import { SAVINGS_FLOAT } from "@/lib/assets";
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

export function SavingsHero({
  amount,
  active,
  pace,
  streak,
  onNew,
}: {
  amount: number;
  active: number;
  pace: number;
  streak: number;
  onNew: () => void;
}) {
  const { hidden, toggle } = useHiddenAmount();
  const gridId = useId().replace(/:/g, "");
  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });

  return (
    <section className="lb-house-card relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-[1.25rem] p-5 text-white sm:min-h-[15.5rem]">
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
          <p className="text-[15px] font-semibold">In your pots</p>
          <p className="mt-0.5 text-xs text-white/70">Money you set aside, on your rhythm</p>
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
      <div className="relative z-10 mt-5 min-w-0 pr-2">
        <p className="font-mono text-[2.15rem] font-black leading-none tracking-tight sm:text-[2.35rem]">
          {shown}
          {hidden ? null : <span className="ml-1.5 text-sm font-semibold tracking-normal text-white/80">XAF</span>}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-semibold">{active} active</span>
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-semibold">
            {hidden ? "••••" : formatXAF(pace, { withCurrency: false })} / mo
          </span>
          <span className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-semibold">{streak} best streak</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="relative z-10 mt-auto flex items-center justify-between border-t border-white/20 pt-3.5 text-sm font-semibold"
      >
        New plan
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
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
        "group block rounded-[1.5rem] bg-white p-4 shadow-[0_8px_22px_rgba(12,25,19,0.05)] ring-1 transition hover:-translate-y-0.5 hover:ring-brand/40",
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
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-line/80 shadow-[0_10px_30px_rgba(6,38,28,0.06)] transition hover:shadow-[0_16px_40px_rgba(6,38,28,0.12)]"
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
          <p className="text-[15px] font-black leading-tight text-ink">Savings pots</p>
          <p className="mt-0.5 truncate text-xs text-muted">500 XAF a day becomes 15,000 a month.</p>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-white transition group-hover:bg-brand-dark">
          <PiggyBank className="h-3.5 w-3.5" /> Start saving
        </span>
      </div>
    </Link>
  );
}
