"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Coffee, Pause, Play, Square, X } from "lucide-react";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { celebrate } from "@/components/success-moment";
import { formatXAF } from "@/lib/format";
import { useSavingsAction } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import { PAUSE, pauseAllowance, pauseOptions, stopQuote } from "@/lib/savings";
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

/** "Manage pot" card: take a break, resume, or stop saving. */
export function PotControls({ plan }: { plan: SavingsPlan }) {
  const [sheet, setSheet] = useState<"pause" | "stop" | null>(null);
  const act = useSavingsAction(plan.id);
  const notify = useNotify();
  const allowance = pauseAllowance(plan);
  const paused = plan.status === "paused";
  const quote = stopQuote(plan);

  async function resume() {
    try {
      await act.mutateAsync({ action: "resume" });
      notify.success("Welcome back", `${plan.name} is saving again. Your schedule moved forward by the break.`);
    } catch (err) {
      notify.error("Could not resume", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80">
      <h2 className="text-base font-black text-ink">Manage this pot</h2>
      <p className="mt-1 text-[13px] leading-5 text-muted">
        Life happens. Take a short break, or stop for good. Stopping early costs the fee you promised.
      </p>

      <div className="mt-4 grid gap-2">
        {paused ? (
          <button
            type="button"
            onClick={() => void resume()}
            disabled={act.isPending}
            className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4 text-left ring-1 ring-brand/30 transition hover:ring-brand"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
              <Play className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink">Resume saving now</span>
              <span className="block text-[13px] text-muted">
                On a break until {plan.pausedUntil ? day(plan.pausedUntil) : "soon"}. It resumes on its own then.
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSheet("pause")}
            disabled={!allowance.canPause}
            className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-left ring-1 ring-line transition hover:ring-brand/40 disabled:opacity-60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink ring-1 ring-line">
              <Pause className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink">Take a break</span>
              <span className="block text-[13px] text-muted">
                {allowance.left
                  ? `Free. ${allowance.left} of ${PAUSE.maxPauses} breaks left, up to ${allowance.maxDays} days each.`
                  : "You've used both breaks for this pot."}
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSheet("stop")}
          className="flex items-center gap-3 rounded-2xl p-4 text-left ring-1 ring-line transition hover:bg-[#fdf3f2] hover:ring-danger/30"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fdecea] text-danger">
            <Square className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink">Stop saving</span>
            <span className="tabular block text-[13px] text-muted">
              {quote.free
                ? "Free. Everything goes back to your wallet."
                : `Costs ${formatXAF(quote.fee)} today (${Math.round(plan.penaltyRate * 100)}%).`}
            </span>
          </span>
        </button>
      </div>

      {sheet === "pause" ? <PauseSheet plan={plan} onClose={() => setSheet(null)} /> : null}
      {sheet === "stop" ? <StopSheet plan={plan} onClose={() => setSheet(null)} /> : null}
    </section>
  );
}

function PauseSheet({ plan, onClose }: { plan: SavingsPlan; onClose: () => void }) {
  const options = pauseOptions(plan.frequency);
  const [days, setDays] = useState(options[Math.min(1, options.length - 1)]);
  const act = useSavingsAction(plan.id);
  const [error, setError] = useState("");
  const [openedAt] = useState(() => Date.now());
  const until = new Date(openedAt + days * 86_400_000).toISOString();
  const allowance = pauseAllowance(plan);

  async function confirm() {
    setError("");
    try {
      await act.mutateAsync({ action: "pause", days });
      onClose();
      celebrate({
        title: "Enjoy your break",
        line: `${plan.name} is paused until ${day(until)}`,
        details: [
          { label: "Saves due", value: "None until then" },
          { label: "Missed-save fees", value: "None" },
          { label: "Breaks left", value: String(allowance.left - 1) },
        ],
        note: "Your schedule moves forward by the length of the break. Resume early any time.",
        pending: true,
        doneLabel: "Got it",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pause.");
    }
  }

  return (
    <Sheet title="Take a break" kicker={plan.name} onClose={onClose}>
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gold-soft p-4">
        <Coffee className="h-5 w-5 shrink-0 text-[#7a5a1c]" />
        <p className="text-[14px] leading-5 text-[#5c4413]">
          No saves are due and no fees apply while you&apos;re on a break. Your money stays safe in the pot.
        </p>
      </div>

      <p className="mt-6 text-[15px] font-bold text-ink">For how long?</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={cn(
              "rounded-2xl px-4 py-3 text-left transition",
              days === d ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
            )}
          >
            <span className="block text-[15px] font-bold text-ink">{d} days</span>
            <span className="block text-[12px] text-muted">
              until {day(new Date(openedAt + d * 86_400_000).toISOString())}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-[13px] text-muted">
        This uses 1 of your {allowance.left} remaining break{allowance.left === 1 ? "" : "s"} for this pot.
      </p>
      {error ? <p className="mt-3 text-sm font-semibold text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={() => void confirm()}
        disabled={act.isPending}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[16px] font-bold text-white transition hover:bg-ink/90 disabled:opacity-60"
      >
        <Pause className="h-4 w-4" /> {act.isPending ? "Pausing…" : `Pause for ${days} days`}
      </button>
    </Sheet>
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
          <p className="mt-3 text-[13px] leading-5 text-muted">
            A break might be all you need: it&apos;s free and keeps your progress.
          </p>
        </div>
      ) : null}

      <dl className="mt-5 overflow-hidden rounded-2xl ring-1 ring-line">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-[14px] text-muted">In the pot</dt>
          <dd className="tabular text-[14px] font-bold text-ink">{formatXAF(plan.balance)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line px-4 py-3">
          <dt className="text-[14px] text-muted">
            {quote.free ? "Fee" : `Early stop fee (${Math.round(plan.penaltyRate * 100)}%)`}
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
            I understand stopping before my goal costs <strong>{formatXAF(quote.fee)}</strong>, the fee I chose when I
            started this pot. This can&apos;t be undone.
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
