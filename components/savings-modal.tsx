"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Lock, Pencil, X, Zap } from "lucide-react";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PlanIcon, PLAN_ICON_OPTIONS } from "@/components/plan-icon";
import { celebrate } from "@/components/success-moment";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";
import { useCreateSavingsPlan } from "@/lib/hooks/wallet";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import {
  FREQUENCIES,
  SAVINGS,
  calculateTargetDate,
  durationLabel,
  frequencyEvery,
  frequencyLabel,
  penaltyFor,
  validatePlanInput,
} from "@/lib/savings";
import type { SavingsFrequency, SavingsPlan } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

const GOALS = [
  { icon: "home", name: "Rent" },
  { icon: "graduation", name: "School fees" },
  { icon: "shield", name: "Emergency fund" },
  { icon: "smartphone", name: "New phone" },
  { icon: "briefcase", name: "My business" },
  { icon: "plane", name: "Travel" },
  { icon: "car", name: "Car" },
  { icon: "sparkles", name: "A dream" },
] as const;

const AMOUNTS: Record<SavingsFrequency, number[]> = {
  daily: [500, 1000, 2500, 5000],
  weekly: [2500, 5000, 10000, 25000],
  monthly: [10000, 25000, 50000, 100000],
};

const DURATIONS: Record<SavingsFrequency, Array<{ label: string; cycles: number }>> = {
  daily: [
    { label: "30 days", cycles: 30 },
    { label: "3 months", cycles: 90 },
    { label: "6 months", cycles: 180 },
    { label: "1 year", cycles: 365 },
  ],
  weekly: [
    { label: "2 months", cycles: 8 },
    { label: "3 months", cycles: 12 },
    { label: "6 months", cycles: 26 },
    { label: "1 year", cycles: 52 },
  ],
  monthly: [
    { label: "3 months", cycles: 3 },
    { label: "6 months", cycles: 6 },
    { label: "1 year", cycles: 12 },
    { label: "2 years", cycles: 24 },
  ],
};

const PROMISES = [
  { rate: 2, label: "Gentle", hint: "A light nudge" },
  { rate: 5, label: "Steady", hint: "Recommended" },
  { rate: 10, label: "Strict", hint: "Hard to ignore" },
  { rate: 15, label: "Serious", hint: "For must-hit goals" },
] as const;

const UNIT: Record<SavingsFrequency, { one: string; many: string; per: string }> = {
  daily: { one: "day", many: "days", per: "a day" },
  weekly: { one: "week", many: "weeks", per: "a week" },
  monthly: { one: "month", many: "months", per: "a month" },
};

const STEP_TITLES = ["Your goal", "Your plan", "Your promise"] as const;

const fmt = (n: number) => n.toLocaleString("fr-FR");
/** "10 Jan 2027": savings dates are days, never times. */
const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Douala" }).format(
    new Date(iso),
  );

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

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

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(PLAN_ICON_OPTIONS[0].id);
  const [showAllIcons, setShowAllIcons] = useState(false);

  const [frequency, setFrequency] = useState<SavingsFrequency>("daily");
  const [amount, setAmount] = useState("1000");
  const [cycles, setCycles] = useState<number | null>(90);
  const [custom, setCustom] = useState<"none" | "cycles" | "date">("none");
  const [customCycles, setCustomCycles] = useState("");
  const [customDate, setCustomDate] = useState("");

  const [penalty, setPenalty] = useState(5);
  const [fineTune, setFineTune] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmOpen, onClose]);

  const value = Math.round(Number(amount.replace(/\D/g, "")) || 0);
  const unit = UNIT[frequency];

  const activeCycles = useMemo(() => {
    if (custom === "none") return cycles;
    if (custom === "cycles") {
      const n = Math.round(Number(customCycles));
      return n > 0 ? Math.min(n, 1000) : null;
    }
    if (customDate) {
      const days = Math.max(1, Math.ceil((new Date(customDate).getTime() - openedAt) / 86_400_000));
      if (frequency === "daily") return days;
      if (frequency === "weekly") return Math.max(1, Math.ceil(days / 7));
      return Math.max(1, Math.ceil(days / 30));
    }
    return null;
  }, [custom, cycles, customCycles, customDate, frequency, openedAt]);

  const target = value > 0 && activeCycles ? value * activeCycles : null;

  const maturityDate = useMemo(() => {
    if (custom === "date" && customDate) return new Date(customDate).toISOString();
    if (!activeCycles) return null;
    return calculateTargetDate(frequency, activeCycles);
  }, [custom, customDate, activeCycles, frequency]);

  const missFee = penaltyFor({ amount: value, penaltyRate: penalty / 100 });
  const exampleWithdraw = target ? Math.round(target / 2) : value * 10;
  const earlyFee = Math.round(exampleWithdraw * (penalty / 100));

  const input = {
    name: name.trim(),
    icon,
    emoji: "🎯",
    frequency,
    amount: value,
    target,
    targetDate: maturityDate || undefined,
    durationCycles: activeCycles || undefined,
    penaltyRate: penalty / 100,
    autoSave,
  };
  const issue = validatePlanInput(input);

  if (!open) return null;

  const canNext =
    step === 0 ? name.trim().length >= 2 : step === 1 ? value >= SAVINGS.minAmount && value <= SAVINGS.maxAmount : !issue;

  function next() {
    if (!canNext) return;
    if (step < 2) setStep(step + 1);
    else {
      setPinError("");
      setConfirmOpen(true);
    }
  }

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      const res = await create.mutateAsync({ ...input, pin });
      notify.success("Savings pot created", `${input.name} · ${formatXAF(value)} ${frequencyEvery(frequency)}`);
      setConfirmOpen(false);
      onClose();
      onCreated?.(res.plan);
      celebrate({
        title: "Your pot is ready!",
        line: `${input.name} · ${formatXAF(value)} ${unit.per}`,
        details: [
          ...(target ? [{ label: "Goal", value: formatXAF(target) }] : []),
          ...(maturityDate ? [{ label: "Reached by", value: day(maturityDate) }] : []),
          { label: "Auto-save", value: autoSave ? "On" : "Off" },
          { label: "Saver points", value: "+25 to start" },
        ],
        note: "Your first save is due at the end of the first cycle. Nothing has been taken yet.",
        doneLabel: "Let's go",
      });
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not create pot", fail.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-end bg-forest/60 backdrop-blur-sm md:place-items-center md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pot-step-title"
        onClick={(e) => e.stopPropagation()}
        className="lb-sheet flex h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:h-auto md:max-h-[88vh] md:rounded-[2rem]"
      >
        {/* ---------------- Header ---------------- */}
        <header className="shrink-0 px-5 pb-4 pt-3 sm:px-6">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink transition hover:bg-line/60"
              aria-label={step === 0 ? "Close" : "Back"}
            >
              {step === 0 ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-muted">
                New savings pot · Step {step + 1} of 3
              </p>
              <h2 id="pot-step-title" className="truncate text-lg font-black tracking-tight text-ink">
                {STEP_TITLES[step]}
              </h2>
            </div>
            {step > 0 ? (
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-colors duration-300", i <= step ? "bg-brand" : "bg-line")}
              />
            ))}
          </div>
        </header>

        {/* ---------------- Body ---------------- */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
          {step > 0 ? <PotChip icon={icon} name={name} target={target} onEdit={() => setStep(0)} /> : null}

          {step === 0 ? (
            <div key="goal" className="lb-rise space-y-6">
              <div>
                <label htmlFor="pot-name" className="text-[15px] font-bold text-ink">
                  What are you saving for?
                </label>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-paper p-2 pr-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                  <PlanIcon icon={icon} size="lg" />
                  <input
                    id="pot-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="e.g. Rent for January"
                    maxLength={40}
                    autoFocus
                    className="h-12 min-w-0 flex-1 bg-transparent text-lg font-bold text-ink outline-none placeholder:font-medium placeholder:text-muted/60"
                  />
                </div>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-muted">Or pick one</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {GOALS.map((g) => {
                    const active = icon === g.icon && name === g.name;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() => {
                          setIcon(g.icon);
                          setName(g.name);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl px-1 py-3 text-center transition active:scale-[0.97]",
                          active ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
                        )}
                      >
                        <PlanIcon icon={g.icon} size="md" />
                        <span className="text-[12px] font-semibold leading-tight text-ink">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAllIcons((v) => !v)}
                  className="text-[13px] font-bold text-brand-deep"
                >
                  {showAllIcons ? "Hide icons" : "Choose a different icon"}
                </button>
                {showAllIcons ? (
                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {PLAN_ICON_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        aria-label={item.label}
                        className={cn(
                          "grid place-items-center rounded-2xl p-1.5 transition",
                          icon === item.id ? "bg-brand-soft ring-2 ring-brand" : "hover:bg-paper",
                        )}
                      >
                        <PlanIcon icon={item.id} size="md" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div key="plan" className="lb-rise space-y-7">
              <div>
                <p className="text-[15px] font-bold text-ink">How often will you save?</p>
                <div role="radiogroup" className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-paper p-1 ring-1 ring-line">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      role="radio"
                      aria-checked={frequency === f.value}
                      onClick={() => {
                        setFrequency(f.value);
                        setAmount(String(AMOUNTS[f.value][1]));
                        setCycles(DURATIONS[f.value][1].cycles);
                        setCustom("none");
                      }}
                      className={cn(
                        "h-11 rounded-xl text-[14px] font-bold transition",
                        frequency === f.value ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="pot-amount" className="text-[15px] font-bold text-ink">
                  How much each {unit.one}?
                </label>
                <div className="mt-3 flex items-baseline gap-2 border-b-2 border-line pb-2 focus-within:border-brand">
                  <input
                    id="pot-amount"
                    inputMode="numeric"
                    value={value ? fmt(value) : ""}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="tabular w-full min-w-0 bg-transparent font-mono text-4xl font-black tracking-tight text-ink outline-none placeholder:text-line"
                  />
                  <span className="text-lg font-bold text-muted">XAF</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMOUNTS[frequency].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAmount(String(n))}
                      className={cn(
                        "tabular rounded-full px-3.5 py-2 text-[13px] font-bold transition",
                        value === n ? "bg-ink text-white" : "bg-paper text-ink ring-1 ring-line hover:ring-brand/40",
                      )}
                    >
                      {fmt(n)}
                    </button>
                  ))}
                </div>
                {value > 0 && value < SAVINGS.minAmount ? (
                  <p className="mt-2 text-[13px] text-danger">At least {fmt(SAVINGS.minAmount)} XAF per save.</p>
                ) : null}
              </div>

              <div>
                <p className="text-[15px] font-bold text-ink">For how long?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {DURATIONS[frequency].map((d) => {
                    const active = custom === "none" && cycles === d.cycles;
                    return (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => {
                          setCustom("none");
                          setCycles(d.cycles);
                        }}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-left transition",
                          active ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
                        )}
                      >
                        <span className="block text-[14px] font-bold text-ink">{d.label}</span>
                        <span className="tabular block text-[12px] text-muted">
                          {value ? `${fmt(value * d.cycles)} XAF` : `${d.cycles} saves`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { id: "none-open", label: "No end date" },
                      { id: "cycles", label: `Number of ${unit.many}` },
                      { id: "date", label: "Pick a date" },
                    ] as const
                  ).map((opt) => {
                    const active =
                      opt.id === "none-open" ? custom === "none" && cycles === null : custom === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === "none-open") {
                            setCustom("none");
                            setCycles(null);
                          } else setCustom(opt.id);
                        }}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-[13px] font-semibold transition",
                          active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-brand/40",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {custom === "cycles" ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-paper px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                    <input
                      inputMode="numeric"
                      value={customCycles}
                      onChange={(e) => setCustomCycles(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="45"
                      autoFocus
                      className="tabular h-12 w-full bg-transparent text-lg font-bold text-ink outline-none"
                    />
                    <span className="text-[14px] font-semibold text-muted">{unit.many}</span>
                  </div>
                ) : null}
                {custom === "date" ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-paper px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                    <CalendarDays className="h-4 w-4 text-muted" />
                    <input
                      type="date"
                      min={new Date(openedAt + 86_400_000).toISOString().split("T")[0]}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-12 w-full bg-transparent text-[15px] font-bold text-ink outline-none"
                    />
                  </div>
                ) : null}
              </div>

              <Outcome value={value} unit={unit.per} target={target} maturityDate={maturityDate} />
            </div>
          ) : null}

          {step === 2 ? (
            <div key="promise" className="lb-rise space-y-6">
              <div>
                <p className="text-[15px] font-bold text-ink">How strict should your pot be?</p>
                <p className="mt-1 text-[14px] leading-6 text-muted">
                  A small fee you choose makes skipping a save hurt a little. It works like a njangi that never forgets.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PROMISES.map((p) => {
                    const active = penalty === p.rate && !fineTune;
                    return (
                      <button
                        key={p.rate}
                        type="button"
                        onClick={() => {
                          setPenalty(p.rate);
                          setFineTune(false);
                        }}
                        className={cn(
                          "relative rounded-2xl px-4 py-3.5 text-left transition",
                          active ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-[15px] font-bold text-ink">{p.label}</span>
                          <span className="tabular font-mono text-[15px] font-black text-ink">{p.rate}%</span>
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted">{p.hint}</span>
                        {active ? (
                          <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setFineTune((v) => !v)}
                  className="mt-3 text-[13px] font-bold text-brand-deep"
                >
                  {fineTune ? "Use a preset" : "Pick an exact %"}
                </button>
                {fineTune ? (
                  <div className="mt-3 rounded-2xl bg-paper p-4 ring-1 ring-line">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-semibold text-muted">Your fee</span>
                      <span className="tabular font-mono text-2xl font-black text-ink">{penalty}%</span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(SAVINGS.minPenaltyRate * 100)}
                      max={Math.round(SAVINGS.maxPenaltyRate * 100)}
                      value={penalty}
                      onChange={(e) => setPenalty(Number(e.target.value))}
                      aria-label="Fee percentage"
                      className="mt-3 w-full accent-brand"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-muted">
                      <span>{Math.round(SAVINGS.minPenaltyRate * 100)}%</span>
                      <span>{Math.round(SAVINGS.maxPenaltyRate * 100)}%</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-2xl ring-1 ring-line">
                <p className="bg-paper px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
                  Exactly what {penalty}% means
                </p>
                <ul className="divide-y divide-line">
                  {target || maturityDate ? (
                    <li className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-[14px] text-ink">You reach your goal or end date</span>
                      <span className="shrink-0 text-[14px] font-bold text-brand-deep">Take it all, free</span>
                    </li>
                  ) : (
                    <li className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-[14px] text-ink">You withdraw, any time</span>
                      <span className="shrink-0 text-[14px] font-bold text-brand-deep">Free (no end date)</span>
                    </li>
                  )}
                  <li className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-[14px] text-ink">You miss a save</span>
                    <span className="tabular shrink-0 text-[14px] font-bold text-ink">−{fmt(missFee)} XAF</span>
                  </li>
                  {target || maturityDate ? (
                    <li className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-[14px] text-ink">
                        You withdraw {fmt(exampleWithdraw)} XAF before then
                      </span>
                      <span className="tabular shrink-0 text-[14px] font-bold text-ink">−{fmt(earlyFee)} XAF</span>
                    </li>
                  ) : null}
                </ul>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper p-4 ring-1 ring-line">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-deep ring-1 ring-line">
                  <Zap className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-ink">Save automatically</span>
                  <span className="block text-[13px] leading-5 text-muted">
                    We move {fmt(value)} XAF from your wallet when it&apos;s due, so you never miss.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
                />
              </label>

              {autoSave && value > balance ? (
                <p className="rounded-2xl bg-gold-soft px-4 py-3 text-[13px] leading-5 text-[#6b4f17]">
                  Your wallet has {formatXAF(balance)} right now. Add money before the first save is due so auto-save
                  can run.
                </p>
              ) : null}
              {issue ? <p className="text-[13px] font-semibold text-danger">{issue}</p> : null}
            </div>
          ) : null}
        </div>

        {/* ---------------- Footer ---------------- */}
        <footer className="shrink-0 border-t border-line bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 md:pb-4">
          <button
            type="button"
            disabled={!canNext}
            onClick={next}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(0,179,105,0.8)] transition hover:bg-brand-dark active:scale-[0.99] disabled:bg-line disabled:text-muted disabled:shadow-none"
          >
            {step < 2 ? (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Create pot
              </>
            )}
          </button>
          {step === 2 ? (
            <p className="mt-2 text-center text-[12px] text-muted">Nothing is taken today. You&apos;ll confirm with your PIN.</p>
          ) : null}
        </footer>

        <ConfirmSheet
          open={confirmOpen}
          title="Create savings pot"
          subtitle={`${input.name} · ${frequencyLabel(frequency)}`}
          amount={value}
          details={[
            { label: "Each save", value: `${formatXAF(value)} ${frequencyEvery(frequency)}` },
            { label: "For", value: activeCycles ? durationLabel(frequency, activeCycles) : "No end date" },
            { label: "Goal", value: target ? formatXAF(target) : "No fixed goal" },
            { label: "Reached by", value: maturityDate ? day(maturityDate) : "When you decide" },
            {
              label: "Fee",
              value: target || maturityDate ? `${penalty}% if you miss a save or withdraw early` : `${penalty}% if you miss a save`,
            },
            { label: "Auto-save", value: autoSave ? "On" : "Off" },
          ]}
          warning="No money moves right now. Your first save is due at the end of the first cycle."
          loading={create.isPending}
          error={pinError}
          lockedUntil={lockedUntil}
          confirmLabel="Enter PIN to create your pot"
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function PotChip({
  icon,
  name,
  target,
  onEdit,
}: {
  icon: string;
  name: string;
  target: number | null;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="mb-6 flex w-full items-center gap-3 rounded-2xl bg-paper p-2.5 pr-4 text-left ring-1 ring-line transition hover:ring-brand/40"
    >
      <PlanIcon icon={icon} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">{name}</span>
        <span className="tabular block text-[12px] text-muted">
          {target ? `Goal ${formatXAF(target)}` : "Savings pot"}
        </span>
      </span>
      <Pencil className="h-4 w-4 text-muted" />
    </button>
  );
}

function Outcome({
  value,
  unit,
  target,
  maturityDate,
}: {
  value: number;
  unit: string;
  target: number | null;
  maturityDate: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-forest p-5 text-white">
      <div className="lb-glow pointer-events-none absolute inset-0" />
      <div className="relative">
        {target && maturityDate ? (
          <>
            <p className="text-[13px] font-medium text-hero-muted">By {day(maturityDate)} you&apos;ll have</p>
            <p className="tabular mt-1 font-mono text-[2rem] font-black leading-none tracking-tight">
              {fmt(target)} <span className="text-base font-bold text-hero-muted">XAF</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium text-hero-muted">No end date. You&apos;ll be saving</p>
            <p className="tabular mt-1 font-mono text-[2rem] font-black leading-none tracking-tight">
              {fmt(value)} <span className="text-base font-bold text-hero-muted">XAF {unit}</span>
            </p>
          </>
        )}
        <p className="mt-3 text-[13px] text-white/70">
          {fmt(value)} XAF {unit}. Free to collect once you reach it.
        </p>
      </div>
    </div>
  );
}
