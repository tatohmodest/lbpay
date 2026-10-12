"use client";

import type { ReactNode } from "react";
import { Check, Lock, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";
import { NetworkMark } from "@/components/network-mark";
import { cn } from "@/lib/cn";

type Network = "mtn" | "orange" | "card" | "wallet";

/* ------------------------------------------------------------------ */
/* Method picker                                                       */
/* ------------------------------------------------------------------ */

export function MethodPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label?: string;
  options: Array<{ id: T; network: Network; title: string; hint?: string; disabled?: boolean; badge?: string }>;
  value: T;
  onChange: (id: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div>
      {label ? <p className="mb-2.5 text-[14px] font-bold text-ink">{label}</p> : null}
      <div role="radiogroup" aria-label={label} className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={o.disabled}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                columns === 3 && "flex-col gap-2 px-2 py-3.5 text-center",
                active ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
              )}
            >
              <NetworkMark network={o.network} className="h-10 w-10 rounded-xl text-[9px]" />
              <span className="min-w-0 leading-tight">
                <span className="block text-[14px] font-bold text-ink">{o.title}</span>
                {o.hint ? <span className="block truncate text-[12px] text-muted">{o.hint}</span> : null}
              </span>
              {o.badge ? (
                <span className="absolute -top-2 right-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  {o.badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Waiting for the customer to approve on their phone                  */
/* ------------------------------------------------------------------ */

const NETWORK_NAME: Record<Network, string> = {
  mtn: "MTN MoMo",
  orange: "Orange Money",
  card: "card",
  wallet: "LBPay",
};

export function WaitingOnPhone({
  network,
  amountLabel,
  seconds,
  total = 120,
  ussd,
  stage = "approve",
  checking,
  onCheck,
  onCancel,
}: {
  network: Network;
  amountLabel: string;
  seconds: number;
  total?: number;
  ussd?: string;
  /** approve: waiting on the customer's PIN · sending: LBPay is paying out */
  stage?: "approve" | "sending";
  checking?: boolean;
  onCheck?: () => void;
  onCancel: () => void;
}) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const r = 54;
  const c = 2 * Math.PI * r;
  const sending = stage === "sending";
  return (
    <section className="lb-rise overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
      <div className="relative bg-forest px-6 pb-8 pt-7 text-center text-white">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid h-36 w-36 place-items-center">
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <span className="lb-float relative grid h-20 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Smartphone className="h-8 w-8 text-white" />
            <NetworkMark
              network={network}
              className="lb-live-dot absolute -bottom-2 -right-3 h-8 w-8 rounded-xl text-[8px] ring-2 ring-forest"
            />
          </span>
        </div>
        <p className="tabular relative mt-3 font-mono text-sm font-bold text-hero-muted">{seconds}s left</p>
        <h2 className="relative mt-3 text-2xl font-black tracking-tight">
          {sending ? "Sending the money…" : "Approve on your phone"}
        </h2>
        <p className="relative mx-auto mt-2 max-w-xs text-[14px] leading-6 text-hero-muted">
          {sending
            ? `We're paying ${amountLabel} out on ${NETWORK_NAME[network]}. This usually takes a few seconds.`
            : `A ${NETWORK_NAME[network]} popup is asking you to confirm ${amountLabel}. Enter your ${NETWORK_NAME[network]} PIN there.`}
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {!sending && ussd ? (
          <ol className="space-y-2.5 text-[14px] text-ink">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-[12px] font-bold">1</span>
              Look for the popup on your phone and enter your PIN.
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-[12px] font-bold">2</span>
              <span>
                No popup? Dial <span className="rounded-md bg-paper px-1.5 py-0.5 font-mono font-bold">{ussd}</span> and
                approve the pending payment.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-[12px] font-bold">3</span>
              This page updates on its own the moment it&apos;s done.
            </li>
          </ol>
        ) : null}
        <div className="grid gap-2">
          {onCheck ? (
            <button
              type="button"
              onClick={onCheck}
              disabled={checking}
              className="flex h-12 items-center justify-center rounded-2xl bg-ink text-[15px] font-bold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {checking ? "Checking…" : "I've approved it"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-2xl text-[14px] font-semibold text-muted transition hover:bg-paper hover:text-ink"
          >
            Stop waiting
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */

export function TrustStrip({ refund = false, className }: { refund?: boolean; className?: string }) {
  const items: Array<{ icon: typeof Lock; text: string }> = [
    { icon: Lock, text: "Your PIN approves it" },
    { icon: ShieldCheck, text: "Fee shown first" },
    ...(refund ? [{ icon: RotateCcw, text: "Refunded if it fails" }] : []),
  ];
  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted", className)}>
      {items.map((i) => (
        <li key={i.text} className="flex items-center gap-1.5">
          <i.icon className="h-3.5 w-3.5 text-brand" /> {i.text}
        </li>
      ))}
    </ul>
  );
}

/** Small "available balance" pill used at the top of money forms. */
export function BalancePill({ label = "Available", amount }: { label?: string; amount: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[13px] text-muted ring-1 ring-line">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      {label} <span className="tabular font-bold text-ink">{amount}</span>
    </p>
  );
}
