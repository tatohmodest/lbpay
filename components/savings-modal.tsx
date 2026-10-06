"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Flame,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PlanIcon, PLAN_ICON_OPTIONS } from "@/components/plan-icon";
import { formatDate, formatXAF } from "@/lib/format";
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
  monthlyPace,
  penaltyFor,
  validatePlanInput,
} from "@/lib/savings";
import type { SavingsFrequency, SavingsPlan } from "@/lib/types";

type DurationPreset = {
  label: string;
  cycles: number | null;
  badge?: string;
};

const DURATION_PRESETS: Record<SavingsFrequency, DurationPreset[]> = {
  daily: [
    { label: "10 Days", cycles: 10, badge: "Sprint" },
    { label: "21 Days", cycles: 21, badge: "Habit" },
    { label: "30 Days", cycles: 30, badge: "1 Mo" },
    { label: "60 Days", cycles: 60, badge: "2 Mos" },
    { label: "90 Days", cycles: 90, badge: "Quarter" },
    { label: "180 Days", cycles: 180, badge: "6 Mos" },
    { label: "1 Year", cycles: 365, badge: "Annual" },
    { label: "Open-ended", cycles: null },
  ],
  weekly: [
    { label: "2 Weeks", cycles: 2, badge: "Quick" },
    { label: "4 Weeks", cycles: 4, badge: "1 Mo" },
    { label: "8 Weeks", cycles: 8, badge: "2 Mos" },
    { label: "12 Weeks", cycles: 12, badge: "Quarter" },
    { label: "26 Weeks", cycles: 26, badge: "6 Mos" },
    { label: "1 Year", cycles: 52, badge: "52 Wks" },
    { label: "Open-ended", cycles: null },
  ],
  monthly: [
    { label: "1 Month", cycles: 1 },
    { label: "2 Months", cycles: 2 },
    { label: "3 Months", cycles: 3, badge: "Quarter" },
    { label: "6 Months", cycles: 6, badge: "6 Mos" },
    { label: "1 Year", cycles: 12, badge: "Annual" },
    { label: "2 Years", cycles: 24, badge: "24 Mos" },
    { label: "Open-ended", cycles: null },
  ],
};

const TEMPLATES: Array<{
  name: string;
  icon: string;
  frequency: SavingsFrequency;
  amount: number;
  durationCycles: number | null;
}> = [
  { name: "10-Day Sprint", icon: "target", frequency: "daily", amount: 5000, durationCycles: 10 },
  { name: "Daily Habit", icon: "sparkles", frequency: "daily", amount: 1000, durationCycles: 30 },
  { name: "Emergency Shield", icon: "shield", frequency: "weekly", amount: 10000, durationCycles: 26 },
  { name: "House Rent", icon: "home", frequency: "weekly", amount: 15000, durationCycles: 8 },
  { name: "School Fees", icon: "graduation", frequency: "monthly", amount: 25000, durationCycles: 6 },
  { name: "1-Year Milestone", icon: "gem", frequency: "monthly", amount: 50000, durationCycles: 12 },
];

const STEPS = [
  { id: 0, title: "Goal" },
  { id: 1, title: "Rhythm" },
  { id: 2, title: "Discipline" },
  { id: 3, title: "Review" },
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

  // Wizard active slide index: 0, 1, 2, 3
  const [step, setStep] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PLAN_ICON_OPTIONS[0].id);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [frequency, setFrequency] = useState<SavingsFrequency>("daily");
  const [amount, setAmount] = useState("5000");

  // Duration
  const [durationCycles, setDurationCycles] = useState<number | null>(10);
  const [customDurationInput, setCustomDurationInput] = useState("");
  const [customDateInput, setCustomDateInput] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMode, setCustomMode] = useState<"cycles" | "date">("cycles");

  // Target Goal
  const [customTarget, setCustomTarget] = useState<string>("");
  const [showCustomTargetInput, setShowCustomTargetInput] = useState(false);

  // Commitment percentage (1% to 25%)
  const [penalty, setPenalty] = useState(5);
  const [autoSave, setAutoSave] = useState(true);

  // PIN Sheet
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  const value = Number(amount) || 0;

  // Active cycles
  const activeDurationCycles = useMemo(() => {
    if (!isCustomDuration) return durationCycles;
    if (customMode === "cycles") {
      const parsed = Number(customDurationInput);
      return parsed > 0 ? parsed : null;
    }
    if (customDateInput) {
      const target = new Date(customDateInput);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (frequency === "daily") return diffDays;
      if (frequency === "weekly") return Math.max(1, Math.ceil(diffDays / 7));
      if (frequency === "monthly") return Math.max(1, Math.ceil(diffDays / 30));
    }
    return null;
  }, [isCustomDuration, durationCycles, customMode, customDurationInput, customDateInput, frequency]);

  // Target amount
  const calculatedTargetAmount =
    value > 0 && activeDurationCycles && activeDurationCycles > 0
      ? value * activeDurationCycles
      : null;

  const finalTarget = customTarget ? Number(customTarget) || null : calculatedTargetAmount;

  // Maturity date
  const maturityDate = useMemo(() => {
    if (isCustomDuration && customMode === "date" && customDateInput) {
      return new Date(customDateInput).toISOString();
    }
    if (!activeDurationCycles || activeDurationCycles <= 0) return null;
    return calculateTargetDate(frequency, activeDurationCycles);
  }, [frequency, activeDurationCycles, isCustomDuration, customMode, customDateInput]);

  const penaltyAmount = penaltyFor({ amount: value, penaltyRate: penalty / 100 });
  const pace = monthlyPace({ amount: value, frequency });

  const input = {
    name,
    icon,
    emoji: "🎯",
    frequency,
    amount: value,
    target: finalTarget,
    targetDate: maturityDate || undefined,
    durationCycles: activeDurationCycles || undefined,
    penaltyRate: penalty / 100,
    autoSave,
  };

  const issue = validatePlanInput(input);

  // Commitment level guidance styled with brand harmony
  const commitmentTier = useMemo(() => {
    if (penalty <= 3) {
      return {
        level: "Gentle Pace",
        badge: "Light Commitment",
        color: "bg-paper text-ink border-line",
        pill: "bg-brand-soft text-brand-dark",
        description: "Soft accountability. Best if you might face unexpected expenses.",
      };
    }
    if (penalty <= 7) {
      return {
        level: "Balanced Discipline",
        badge: "Recommended",
        color: "bg-brand-soft/70 text-brand-deep border-brand/30",
        pill: "bg-brand text-white",
        description: "The sweet spot. Strong enough to stop impulse buys, fair for real emergencies.",
      };
    }
    if (penalty <= 12) {
      return {
        level: "Strict Focus",
        badge: "High Accountability",
        color: "bg-amber-50 text-amber-900 border-amber-200",
        pill: "bg-amber-600 text-white",
        description: "Serious savings lock. Keeps your eyes firmly on the prize.",
      };
    }
    return {
      level: "Iron Fortress",
      badge: "Maximum Discipline",
      color: "bg-rose-50 text-rose-900 border-rose-200",
      pill: "bg-rose-600 text-white",
      description: "Unbreakable vault pledge. For non-negotiable milestones like rent or tuition.",
    };
  }, [penalty]);

  if (!open) return null;

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      const res = await create.mutateAsync({ ...input, pin });
      notify.success(
        "Savings pot locked in",
        `${name} · ${formatXAF(value)} ${frequencyEvery(frequency)}${
          activeDurationCycles ? ` for ${durationLabel(frequency, activeDurationCycles)}` : ""
        }.`,
      );
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

  function handleSelectTemplate(tmpl: (typeof TEMPLATES)[number]) {
    setName(tmpl.name);
    setIcon(tmpl.icon);
    setFrequency(tmpl.frequency);
    setAmount(String(tmpl.amount));
    setIsCustomDuration(false);
    setDurationCycles(tmpl.durationCycles);
    setCustomTarget("");
    setShowCustomTargetInput(false);
  }

  function handleAddAmount(delta: number) {
    setAmount(String(Math.max(SAVINGS.minAmount, (Number(amount) || 0) + delta)));
  }

  const durationOptions = DURATION_PRESETS[frequency];

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile-Sized Canvas Frame */}
      <div
        className="w-full max-w-[440px] h-[92vh] max-h-[820px] bg-white overflow-hidden rounded-[32px] sm:rounded-[36px] shadow-2xl relative flex flex-col border border-line select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-step-title"
      >
        {/* Stepper Header */}
        <header className="shrink-0 w-full pt-4 px-6 pb-3 bg-white border-b border-line/70 z-30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink hover:bg-brand-soft hover:text-brand-dark transition cursor-pointer"
                  aria-label="Previous step"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand block leading-none">
                  Step {step + 1} of 4
                </span>
                <h1 id="modal-step-title" className="text-sm font-black text-ink tracking-tight mt-0.5">
                  {step === 0 && "Define Your Goal"}
                  {step === 1 && "Rhythm & Duration"}
                  {step === 2 && "Discipline Shield"}
                  {step === 3 && "Review & Lock In"}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-paper text-muted hover:text-ink hover:bg-line/60 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Progress Bar & Nodes */}
          <div className="px-1 pt-1 pb-1">
            <div className="relative flex items-center justify-between">
              {/* Background Bar */}
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-line z-0" />
              {/* Active Filled Bar in Brand Green */}
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-brand transition-all duration-300 ease-out z-0"
                style={{ width: `${(step / 3) * 92}%` }}
              />

              {STEPS.map((s, idx) => {
                const isPassed = idx < step;
                const isCurrent = idx === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={idx > step && (!name || value < SAVINGS.minAmount)}
                    onClick={() => {
                      if (idx < step) setStep(idx);
                    }}
                    className="relative z-10 flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ring-4 ring-white",
                        isPassed
                          ? "bg-brand text-white shadow-xs"
                          : isCurrent
                            ? "bg-brand text-white ring-brand-soft scale-110 shadow-sm"
                            : "bg-line text-transparent",
                      )}
                    >
                      {isPassed ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : isCurrent ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stepper Node Labels */}
            <div className="flex justify-between items-center text-[10px] text-muted font-bold mt-1.5 px-0.5">
              {STEPS.map((s, idx) => (
                <span
                  key={s.id}
                  className={cn(
                    "transition-colors",
                    idx === step ? "text-brand-dark font-black" : idx < step ? "text-ink" : "text-muted",
                  )}
                >
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Animated Horizontal Slider Track */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-white">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* ---------------- SLIDE 0: THE GOAL ---------------- */}
            <div className="w-full shrink-0 h-full overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div>
                <h2 className="text-base font-black text-ink tracking-tight">What are you saving for?</h2>
                <p className="text-xs text-muted mt-0.5">Give your pot a name and pick an icon.</p>
              </div>

              {/* Quick Inspiration Blueprints */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted block mb-1.5">
                  Quick Blueprints
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink border border-line transition hover:bg-brand-soft hover:text-brand-dark active:scale-95 cursor-pointer"
                    >
                      <PlanIcon icon={tmpl.icon} size="sm" className="h-3.5 w-3.5" />
                      <span>{tmpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pot Name & Icon Selection Card */}
              <div className="bg-paper rounded-[24px] p-4 border border-line space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-xs hover:bg-brand-soft transition cursor-pointer border border-line"
                    title="Choose icon"
                  >
                    <PlanIcon icon={icon} size="md" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted block mb-1">
                      Pot Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. 10-Day Sprint, Laptop, Rent"
                      maxLength={40}
                      className="w-full bg-white text-sm font-bold text-ink rounded-full px-4 py-2.5 border border-line focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-muted/60"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Icon Selector Grid */}
                {showIconPicker ? (
                  <div className="pt-2 border-t border-line animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-muted block mb-2">Pick an icon</span>
                    <div className="grid grid-cols-6 gap-2">
                      {PLAN_ICON_OPTIONS.map((item) => {
                        const isSelected = icon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setIcon(item.id);
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              "grid h-10 w-10 place-items-center rounded-xl transition cursor-pointer mx-auto",
                              isSelected ? "bg-brand text-white shadow-sm ring-2 ring-brand" : "bg-white hover:bg-brand-soft text-ink",
                            )}
                          >
                            <PlanIcon icon={item.id} size="sm" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Gamification Teaser Banner */}
              <div className="bg-brand-soft rounded-[22px] p-3.5 flex items-center gap-3 border border-brand/20">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shrink-0 shadow-xs">
                  <Flame className="h-4 w-4 fill-white" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-brand-dark">+25 Saver XP Points</p>
                  <p className="text-[11px] text-brand-deep">Awarded immediately upon creating your pot.</p>
                </div>
              </div>
            </div>

            {/* ---------------- SLIDE 1: RHYTHM & DURATION ---------------- */}
            <div className="w-full shrink-0 h-full overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div>
                <h2 className="text-base font-black text-ink tracking-tight">Rhythm & Time Length</h2>
                <p className="text-xs text-muted mt-0.5">
                  Set how often you deposit and how long your sprint runs.
                </p>
              </div>

              {/* Section 1: Deposit Rhythm */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted block mb-1.5">
                  1. Deposit Rhythm (How Often)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map((f) => {
                    const isSelected = frequency === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => {
                          setFrequency(f.value);
                          setIsCustomDuration(false);
                          setDurationCycles(f.value === "daily" ? 10 : f.value === "weekly" ? 8 : 6);
                          setCustomTarget("");
                        }}
                        className={cn(
                          "py-2.5 px-3 rounded-full text-xs font-bold text-center transition active:scale-98 cursor-pointer",
                          isSelected
                            ? "bg-brand text-white shadow-sm font-black"
                            : "bg-paper text-ink border border-line hover:bg-brand-soft hover:text-brand-dark",
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount per save */}
              <div className="bg-paper rounded-[24px] p-4 border border-line space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted font-bold">Deposit per {frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}</span>
                  {value ? <span className="text-brand-dark font-mono text-[11px] font-bold">≈ {formatXAF(pace)}/mo pace</span> : null}
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={SAVINGS.minAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono text-2xl font-black tracking-tight text-ink bg-transparent border-0 p-0 focus:ring-0 w-44"
                    placeholder="5000"
                  />
                  <span className="text-xs font-black text-muted">XAF</span>
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-line/60">
                  <span className="text-[10px] text-muted mr-1 font-bold">Add:</span>
                  {[1000, 5000, 10000, 25000].map((stepVal) => (
                    <button
                      key={stepVal}
                      type="button"
                      onClick={() => handleAddAmount(stepVal)}
                      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-mono font-bold text-ink border border-line hover:bg-brand-soft transition cursor-pointer"
                    >
                      +{formatXAF(stepVal, { withCurrency: false })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Duration / Time Horizon */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                    2. Sprint Duration (When It Ends)
                  </span>
                  <span className="text-[11px] font-black text-brand-dark">
                    {activeDurationCycles ? durationLabel(frequency, activeDurationCycles) : "Open-ended"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {durationOptions.map((opt) => {
                    const isSelected = !isCustomDuration && durationCycles === opt.cycles;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setIsCustomDuration(false);
                          setDurationCycles(opt.cycles);
                          setCustomTarget("");
                        }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer",
                          isSelected
                            ? "bg-brand text-white shadow-sm font-black"
                            : "bg-paper text-ink border border-line hover:bg-brand-soft hover:text-brand-dark",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomDuration(true)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                      isCustomDuration
                        ? "bg-brand text-white shadow-sm font-black"
                        : "bg-paper text-ink border border-line hover:bg-brand-soft",
                    )}
                  >
                    Custom
                  </button>
                </div>

                {isCustomDuration ? (
                  <div className="mt-2 bg-paper rounded-2xl p-3 border border-line space-y-2">
                    <div className="flex gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCustomMode("cycles")}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] transition",
                          customMode === "cycles" ? "bg-brand text-white" : "bg-white text-ink border border-line",
                        )}
                      >
                        By {frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : "months"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomMode("date")}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] transition",
                          customMode === "date" ? "bg-brand text-white" : "bg-white text-ink border border-line",
                        )}
                      >
                        Pick date
                      </button>
                    </div>

                    {customMode === "cycles" ? (
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        placeholder="e.g. 10, 45, 90"
                        value={customDurationInput}
                        onChange={(e) => setCustomDurationInput(e.target.value)}
                        className="w-full bg-white text-xs font-bold text-ink rounded-full px-4 py-2 border border-line focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    ) : (
                      <input
                        type="date"
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        value={customDateInput}
                        onChange={(e) => setCustomDateInput(e.target.value)}
                        className="w-full bg-white text-xs font-bold text-ink rounded-full px-4 py-2 border border-line focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    )}
                  </div>
                ) : null}
              </div>

              {/* Live Output Blueprint Card */}
              <div className="bg-brand-soft/80 rounded-[22px] p-3.5 border border-brand/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] uppercase font-black text-brand-dark">Sprint Blueprint</span>
                  <span className="text-[10px] text-brand-deep font-bold">
                    {maturityDate ? `Matures: ${formatDate(maturityDate)}` : "Ongoing"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[9px] text-muted uppercase font-bold block">Target Goal</span>
                    <span className="font-mono text-xl font-black text-brand-dark">
                      {finalTarget ? formatXAF(finalTarget) : "Open-ended"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-muted uppercase font-bold block">Sprint Pace</span>
                    <span className="text-xs font-bold text-ink">
                      {activeDurationCycles ? `${activeDurationCycles} saves` : "Open goal"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- SLIDE 2: DISCIPLINE COMMITMENT (SLIDER) ---------------- */}
            <div className="w-full shrink-0 h-full overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div>
                <h2 className="text-base font-black text-ink tracking-tight">Your Commitment Shield</h2>
                <p className="text-xs text-muted mt-0.5">
                  Set your self-discipline pledge to hold yourself accountable.
                </p>
              </div>

              {/* 100% Free Reassurance Pill */}
              <div className="bg-brand-soft text-brand-deep rounded-[22px] p-3.5 flex items-center gap-3 border border-brand/20">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shrink-0 shadow-xs">
                  <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="text-xs leading-snug">
                  <span className="font-black block text-brand-dark">100% Free Cashout on Completion</span>
                  <span className="text-[11px] text-brand-deep">
                    Zero fees apply when you hit your target or complete your sprint!
                  </span>
                </div>
              </div>

              {/* Interactive Commitment Level with Prominent Slider */}
              <div className="rounded-[24px] bg-paper p-4.5 border border-line space-y-4">
                <div className="text-center pt-1 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted block mb-1">
                    Early-Break Pledge Level
                  </span>
                  <div className="inline-flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-black text-brand tracking-tight">{penalty}</span>
                    <span className="text-xl font-black text-brand">%</span>
                  </div>
                  <p className="text-sm font-black text-ink mt-0.5">{commitmentTier.level}</p>
                  <p className="text-xs text-muted max-w-xs mx-auto mt-0.5">{commitmentTier.description}</p>
                </div>

                {/* Highly Visible Custom Range Slider */}
                <div className="space-y-2 px-1">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={penalty}
                      onChange={(e) => setPenalty(Number(e.target.value))}
                      className="w-full h-3.5 rounded-full appearance-none cursor-pointer accent-brand focus:outline-none"
                      style={{
                        background: `linear-gradient(to right, #00b369 0%, #00b369 ${((penalty - 1) / 24) * 100}%, #e2e8f0 ${((penalty - 1) / 24) * 100}%, #e2e8f0 100%)`,
                      }}
                      aria-label="Commitment penalty percentage"
                    />
                  </div>

                  {/* Scale Markers */}
                  <div className="flex justify-between text-[10px] font-bold text-muted px-1">
                    <span>1% Gentle</span>
                    <span>5% Standard</span>
                    <span>10% Strict</span>
                    <span>15% Fortress</span>
                    <span>25% Max</span>
                  </div>
                </div>

                {/* Quick-Sync Preset Pills */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted block mb-1.5 text-center">
                    Quick Preset Tiers
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Gentle", val: 2 },
                      { label: "Standard", val: 5 },
                      { label: "Strict", val: 10 },
                      { label: "Fortress", val: 15 },
                    ].map((tier) => (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => setPenalty(tier.val)}
                        className={cn(
                          "py-2 rounded-full text-xs font-bold text-center transition cursor-pointer active:scale-95",
                          penalty === tier.val
                            ? "bg-brand text-white shadow-xs font-black"
                            : "bg-white text-ink border border-line hover:bg-brand-soft",
                        )}
                      >
                        {tier.val}% {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transparent Breakdown Card */}
              <div className="bg-paper rounded-[22px] p-3.5 text-xs space-y-2 border border-line">
                <div className="flex justify-between items-center">
                  <span className="text-muted font-bold">Goal reached / Sprint ends:</span>
                  <span className="font-black text-brand-dark">0 XAF fee (100% full payout)</span>
                </div>
                <div className="flex justify-between items-center border-t border-line/60 pt-1.5">
                  <span className="text-muted font-bold">If broken prematurely:</span>
                  <span className="font-black text-rose-600 font-mono">
                    −{formatXAF(penaltyAmount)} ({penalty}% pledge)
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------- SLIDE 3: REVIEW & LOCK IN ---------------- */}
            <div className="w-full shrink-0 h-full overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div>
                <h2 className="text-base font-black text-ink tracking-tight">Review Your Blueprint</h2>
                <p className="text-xs text-muted mt-0.5">
                  Confirm your settings before sealing your vault.
                </p>
              </div>

              {/* LBPay Forest Brand Card */}
              <section className="bg-linear-to-br from-[#06261c] to-[#0e3b2e] text-white rounded-[26px] p-5 relative overflow-hidden space-y-3.5 shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                      <PlanIcon icon={icon} size="md" />
                    </div>
                    <div>
                      <span className="text-hero-muted text-[10px] font-bold uppercase tracking-wider block">
                        Savings Pot
                      </span>
                      <h3 className="text-base font-black tracking-tight">{name || "Your Pot"}</h3>
                    </div>
                  </div>

                  <span className="bg-white/15 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-300" /> +25 XP
                  </span>
                </div>

                <div className="border-t border-white/15 pt-3">
                  <span className="text-hero-muted text-xs font-bold">Target Goal</span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-2xl font-black tracking-tight">
                      {finalTarget ? formatXAF(finalTarget) : "Open-ended"}
                    </span>
                  </div>
                </div>

                {/* Summary Rows */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/15 pt-3 text-white/90">
                  <div>
                    <span className="text-[10px] text-hero-muted block uppercase font-bold">Rhythm:</span>
                    <span className="font-bold text-white">
                      {formatXAF(value)} / {frequency === "daily" ? "day" : frequency === "weekly" ? "wk" : "mo"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hero-muted block uppercase font-bold">Duration:</span>
                    <span className="font-bold text-white">
                      {activeDurationCycles ? durationLabel(frequency, activeDurationCycles) : "Open-ended"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hero-muted block uppercase font-bold">Maturity:</span>
                    <span className="font-bold text-white">
                      {maturityDate ? formatDate(maturityDate) : "When met"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hero-muted block uppercase font-bold">Early Break Fee:</span>
                    <span className="font-bold text-white">{penalty}% ({formatXAF(penaltyAmount)})</span>
                  </div>
                </div>
              </section>

              {/* Auto-save Toggle Card */}
              <label className="bg-paper rounded-[22px] p-3.5 border border-line flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink block">Auto-save from wallet</span>
                    <span className="text-[10px] text-muted block">
                      Deposits {formatXAF(value)} automatically when due.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="h-4 w-4 accent-brand rounded cursor-pointer"
                />
              </label>

              {name && issue ? <p className="text-xs font-semibold text-danger">{issue}</p> : null}
              {value > balance ? (
                <p className="text-[11px] text-muted">
                  Note: Your wallet holds {formatXAF(balance)}. You can deposit anytime after creating your pot.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pinned Bottom Navigation Footer - Always Visible, Never Cut Off */}
        <footer className="shrink-0 w-full bg-white border-t border-line/60 px-5 sm:px-6 py-3.5 pb-safe z-30 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-white text-ink font-bold text-xs py-3.5 px-4 rounded-full border border-line hover:bg-paper active:scale-95 transition cursor-pointer"
            >
              Back
            </button>
          ) : null}

          {step === 0 ? (
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(1)}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-black text-xs py-3.5 px-4 rounded-full flex items-center justify-center space-x-1.5 shadow-md shadow-brand/20 active:scale-98 transition disabled:opacity-40 cursor-pointer"
            >
              <span>Continue: Rhythm & Duration</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : step === 1 ? (
            <button
              type="button"
              disabled={value < SAVINGS.minAmount}
              onClick={() => setStep(2)}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-black text-xs py-3.5 px-4 rounded-full flex items-center justify-center space-x-1.5 shadow-md shadow-brand/20 active:scale-98 transition disabled:opacity-40 cursor-pointer"
            >
              <span>Continue: Set Discipline Pledge</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-black text-xs py-3.5 px-4 rounded-full flex items-center justify-center space-x-1.5 shadow-md shadow-brand/20 active:scale-98 transition cursor-pointer"
            >
              <span>Continue: Review & Seal</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled={Boolean(issue)}
              onClick={() => {
                if (issue) return;
                setPinError("");
                setConfirmOpen(true);
              }}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-black text-xs py-3.5 px-4 rounded-full flex items-center justify-center space-x-2 shadow-lg shadow-brand/25 active:scale-98 transition disabled:opacity-40 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock In Pot & Enter PIN</span>
            </button>
          )}
        </footer>

        {/* PIN Confirm Sheet */}
        <ConfirmSheet
          open={confirmOpen}
          title="Confirm Savings Pot"
          subtitle={`${name} · ${frequencyLabel(frequency)}`}
          amount={value}
          details={[
            { label: "Cycle Save", value: `${formatXAF(value)} ${frequencyEvery(frequency)}` },
            {
              label: "Duration",
              value: activeDurationCycles ? durationLabel(frequency, activeDurationCycles) : "Open-ended",
            },
            { label: "Target Goal", value: finalTarget ? formatXAF(finalTarget) : "Open-ended" },
            { label: "Matures On", value: maturityDate ? formatDate(maturityDate) : "Open-ended" },
            { label: "Accountability Fee", value: `${penalty}% (${formatXAF(penaltyAmount)}) if broken early` },
            { label: "Auto-save", value: autoSave ? "Enabled" : "Manual" },
          ]}
          warning="No money moves right now. Your first save is due at the end of the first cycle."
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
