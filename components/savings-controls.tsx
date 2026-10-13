"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Play, Square, TrendingDown, X } from "lucide-react";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { celebrate } from "@/components/success-moment";
import { formatXAF } from "@/lib/format";
import { useSavingsAction } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import { EARLY_STOP, earlyStopLadder, stopQuote } from "@/lib/savings";
import { cn } from "@/lib/cn";
import type { SavingsPlan } from "@/lib/types";

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Douala" }).format(
    new Date(iso),
  );

function Sheet({
  title,
  kicker,
  onClose,
  children,
}: {
  title: string;
  kicker: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[96] grid place-items-end bg-forest/60 backdrop-blur-sm md:place-items-center md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="lb-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:rounded-[2rem]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold text-muted">{kicker}</p>
            <h2 className="text-2xl font-black tracking-tight text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

/**
 * The fee ladder: quitting costs more the earlier you quit. The saver's
 * current position is marked, so they can see exactly what keeping going buys.
 */
export function QuitLadder({
  penaltyRate,
  progress,
  compact = false,
}: {
  penaltyRate: number;
  progress: number | null;
  compact?: boolean;
}) {
  const ladder = earlyStopLadder(penaltyRate);
  const at = progress ?? 0;
  return (
    <div>
      <div className="grid grid-cols-5 gap-1">
        {ladder.map((step) => {
          const here = progress != null && at >= step.from && at < step.to;
          return (
            <div
              key={step.label}
              className={cn(
                "rounded-xl px-1.5 py-2 text-center ring-1 transition",
                here ? "bg-ink text-white ring-ink" : "bg-paper text-ink ring-line",
              )}
            >
              <p className={cn("tabular font-mono font-black", compact ? "text-[13px]" : "text-[15px]")}>{pct(step.rate)}</p>
              <p className={cn("mt-0.5 text-[10px] leading-tight", here ? "text-white/70" : "text-muted")}>
                {Math.round(step.from * 100)}–{Math.round(step.to * 100)}%
              </p>
            </div>
          );
        })}
        <div
          className={cn(
            "rounded-xl px-1.5 py-2 text-center ring-1",
            progress != null && at >= 1 ? "bg-brand text-white ring-brand" : "bg-brand-soft text-brand-deep ring-brand/30",
          )}
        >
          <p className={cn("font-black", compact ? "text-[13px]" : "text-[15px]")}>Free</p>
          <p className="mt-0.5 text-[10px] leading-tight opacity-80">at goal</p>
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted">
        <span>Costs more early</span>
        <span>Free at the finish</span>
      </div>
    </div>
  );
}

/** "Manage pot" card: what quitting would cost right now, and the way out if needed. */
export function PotControls({ plan }: { plan: SavingsPlan }) {
  const [stopOpen, setStopOpen] = useState(false);
  const act = useSavingsAction(plan.id);
  const notify = useNotify();
  const paused = plan.status === "paused";
  const quote = stopQuote(plan);
  const hasGoal = Boolean(plan.target && plan.target > 0);

  async function resume() {
    try {
      await act.mutateAsync({ action: "resume" });
      notify.success("Back on track", `${plan.name} is saving again.`);
    } catch (err) {
      notify.error("Could not resume", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
          <TrendingDown className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-base font-black text-ink">What quitting costs today</h2>
          <p className="mt-0.5 text-[13px] leading-5 text-muted">
            {hasGoal
              ? "The closer you get to your goal, the less it costs to stop. Keep going and it drops to nothing."
              : "This pot has no goal amount, so you can stop any time for free."}
          </p>
        </div>
      </div>

      {hasGoal ? (
        <div className="mt-4">
          <QuitLadder penaltyRate={plan.penaltyRate} progress={quote.progress} />
        </div>
      ) : null}

      {paused ? (
        <button
          type="button"
          onClick={() => void resume()}
          disabled={act.isPending}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-brand-soft p-4 text-left ring-1 ring-brand/30 transition hover:ring-brand"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
            <Play className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink">Resume saving now</span>
            <span className="block text-[13px] text-muted">This pot is on a break that was set earlier.</span>
          </span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setStopOpen(true)}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 ring-line transition hover:bg-[#fdf3f2] hover:ring-danger/30"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fdecea] text-danger">
          <Square className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">Stop saving</span>
          <span className="tabular block text-[13px] text-muted">
            {quote.free
              ? "Free. Everything goes back to your wallet."
              : `Costs ${formatXAF(quote.fee)} right now (${pct(quote.rate)}).`}
          </span>
        </span>
      </button>

      {stopOpen ? <StopSheet plan={plan} onClose={() => setStopOpen(false)} /> : null}
    </section>
  );
}

function StopSheet({ plan, onClose }: { plan: SavingsPlan; onClose: () => void }) {
  const router = useRouter();
  const act = useSavingsAction(plan.id);
  const notify = useNotify();
  const quote = stopQuote(plan);
  const [agreed, setAgreed] = useState(quote.free);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const progress = plan.target ? Math.min(100, Math.round((plan.balance / plan.target) * 100)) : null;
  // The next cheaper rung on the ladder, and how much more saving gets them there.
  const nextStep = (() => {
    if (!plan.target || quote.free || quote.progress == null) return null;
    const tier = EARLY_STOP.tiers.find((t) => quote.progress! < t.below);
    if (!tier) return null;
    const idx = EARLY_STOP.tiers.indexOf(tier);
    const next = EARLY_STOP.tiers[idx + 1];
    const need = Math.max(1, Math.ceil(plan.target * tier.below - plan.balance));
    const rateLabel = next
      ? pct(Math.min(EARLY_STOP.maxRate, Math.round(plan.penaltyRate * next.factor * 1000) / 1000))
      : "nothing";
    return { need, rateLabel };
  })();

  async function handleConfirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      await act.mutateAsync({ action: "close", pin, breakPenaltyAgreed: agreed });
      notify.moneyIn(quote.returned, `${plan.name} stopped · moved to your wallet`);
      setPinOpen(false);
      onClose();
      celebrate({
        title: "Pot stopped",
        amount: quote.returned,
        line: "is back in your wallet",
        details: quote.fee ? [{ label: "Early stop fee", value: `−${formatXAF(quote.fee)}` }] : undefined,
        note: "Ready when you are. Starting a new pot takes a minute.",
        pending: true,
      });
      router.push("/wallet/savings");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Could not stop the pot", fail.error);
    }
  }

  return (
    <Sheet title="Stop saving?" kicker={plan.name} onClose={onClose}>
      {!quote.free && progress != null ? (
        <div className="mt-5 rounded-2xl bg-paper p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-muted">You&apos;re {progress}% of the way</span>
            <span className="tabular text-[13px] font-bold text-ink">{formatXAF(plan.target!)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          {nextStep ? (
            <p className="mt-3 text-[13px] leading-5 text-ink">
              Save <strong className="tabular">{formatXAF(nextStep.need)}</strong> more and stopping drops to{" "}
              <strong>{nextStep.rateLabel}</strong>. Reach your goal and it&apos;s free.
            </p>
          ) : null}
          <div className="mt-4">
            <QuitLadder penaltyRate={plan.penaltyRate} progress={quote.progress} compact />
          </div>
        </div>
      ) : null}

      <dl className="mt-5 overflow-hidden rounded-2xl ring-1 ring-line">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-[14px] text-muted">In the pot</dt>
          <dd className="tabular text-[14px] font-bold text-ink">{formatXAF(plan.balance)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line px-4 py-3">
          <dt className="text-[14px] text-muted">
            {quote.free ? "Fee" : `Early stop fee (${pct(quote.rate)})`}
          </dt>
          <dd className={cn("tabular text-[14px] font-bold", quote.free ? "text-brand-deep" : "text-danger")}>
            {quote.free ? "Free" : `−${formatXAF(quote.fee)}`}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line bg-paper px-4 py-3">
          <dt className="text-[14px] font-bold text-ink">Back to your wallet</dt>
          <dd className="tabular text-[16px] font-black text-ink">{formatXAF(quote.returned)}</dd>
        </div>
      </dl>

      {!quote.free ? (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fdf3f2] p-4 ring-1 ring-danger/20">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#b42318]"
          />
          <span className="text-[13px] leading-5 text-ink">
            I understand stopping now costs <strong>{formatXAF(quote.fee)}</strong> ({pct(quote.rate)}). The earlier I
            stop, the more it costs. This can&apos;t be undone.
          </span>
        </label>
      ) : null}

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-[16px] font-bold text-white transition hover:bg-brand-dark"
        >
          <Check className="h-4 w-4" /> Keep saving
        </button>
        <button
          type="button"
          disabled={!agreed}
          onClick={() => setPinOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-danger transition hover:bg-[#fdf3f2] disabled:opacity-40"
        >
          <AlertTriangle className="h-4 w-4" /> Stop and move {formatXAF(quote.returned)}
        </button>
      </div>

      <ConfirmSheet
        open={pinOpen}
        title="Stop this pot"
        subtitle={plan.name}
        amount={quote.returned}
        details={[
          { label: "In the pot", value: formatXAF(plan.balance) },
          { label: "Early stop fee", value: quote.fee ? `−${formatXAF(quote.fee)}` : "Free" },
          { label: "To your wallet", value: formatXAF(quote.returned) },
        ]}
        warning="The pot closes for good. Your history keeps every entry."
        loading={act.isPending}
        error={pinError}
        lockedUntil={lockedUntil}
        confirmLabel="Enter PIN to stop"
        onClose={() => setPinOpen(false)}
        onConfirm={handleConfirm}
      />
    </Sheet>
  );
}
