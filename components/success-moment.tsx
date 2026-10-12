"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Check, Clock3, ShieldCheck } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Full-screen "it worked" moment shown after money moves.
 * Lives above routing (mounted in AppProviders), so callers can
 * celebrate() and then navigate without the moment disappearing.
 */

export type SuccessMoment = {
  title: string;
  amount?: number;
  /** One line under the amount, e.g. "to @amina". */
  line?: string;
  details?: { label: string; value: string }[];
  /** Pending rails (Mobile Money) get a calmer, honest state instead of confetti. */
  pending?: boolean;
  /** Reassurance line under the details. Defaults depend on `pending`. */
  note?: string;
  doneLabel?: string;
};

let current: (SuccessMoment & { key: number }) | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function celebrate(moment: SuccessMoment) {
  current = { ...moment, key: Date.now() };
  emit();
}

function dismiss() {
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const COLORS = ["#00b369", "#14c87c", "#c9a45c", "#f4ead2", "#ffcc00", "#ffffff"];

function Confetti({ seed }: { seed: number }) {
  const pieces = Array.from({ length: 26 }, (_, i) => {
    const r = Math.sin(seed + i * 12.9898) * 43758.5453;
    const rand = r - Math.floor(r);
    const angle = (i / 26) * Math.PI * 2 + rand;
    const dist = 110 + rand * 90;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 40,
      rot: (rand - 0.5) * 540,
      color: COLORS[i % COLORS.length],
      w: 6 + (i % 3) * 2,
      round: i % 4 === 0,
      delay: rand * 0.12,
    };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-[88px] h-0 w-0" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={cn("lb-confetti absolute block", p.round ? "rounded-full" : "rounded-[2px]")}
          style={
            {
              width: p.w,
              height: p.round ? p.w : p.w * 1.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function SuccessMomentHost() {
  const moment = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!moment) return;
    doneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moment]);

  if (!moment) return null;
  const pending = Boolean(moment.pending);

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-end bg-forest/70 backdrop-blur-sm md:place-items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lb-success-title"
      onClick={dismiss}
    >
      <div
        key={moment.key}
        className="lb-sheet relative w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-10 text-center shadow-2xl md:rounded-[2rem] md:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(0,179,105,0.14),transparent)]" />
        {pending ? null : <Confetti seed={moment.key} />}

        <div className="relative mx-auto grid h-20 w-20 place-items-center">
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              pending ? "bg-gold-soft" : "lb-live-dot bg-brand-soft",
            )}
          />
          <span
            className={cn(
              "lb-check relative grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_30px_-8px_rgba(0,179,105,0.7)]",
              pending ? "bg-gold" : "bg-brand",
            )}
          >
            {pending ? <Clock3 className="h-7 w-7" /> : <Check className="h-7 w-7" strokeWidth={3} />}
          </span>
        </div>

        <h2 id="lb-success-title" className="relative mt-6 text-2xl font-black tracking-tight text-ink">
          {moment.title}
        </h2>
        {typeof moment.amount === "number" ? (
          <p className="tabular relative mt-2 font-mono text-4xl font-black tracking-tight text-ink">
            {formatXAF(moment.amount)}
          </p>
        ) : null}
        {moment.line ? <p className="relative mt-2 text-[15px] text-muted">{moment.line}</p> : null}

        {moment.details?.length ? (
          <dl className="relative mt-6 space-y-2 rounded-2xl bg-paper p-4 text-left text-sm">
            {moment.details.map((row) => (
              <div key={row.label} className="flex justify-between gap-3">
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-right font-semibold text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="relative mx-auto mt-5 flex max-w-xs items-start justify-center gap-1.5 text-[12px] leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          {moment.note ||
            (pending
              ? "We'll let you know the moment the network confirms."
              : "Confirmed and recorded in your history.")}
        </p>

        <button
          ref={doneRef}
          type="button"
          onClick={dismiss}
          className="relative mt-6 h-12 w-full rounded-2xl bg-ink text-[15px] font-semibold text-white transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {moment.doneLabel || "Done"}
        </button>
      </div>
    </div>
  );
}
