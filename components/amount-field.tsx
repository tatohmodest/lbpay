"use client";

import { useId } from "react";
import { formatXAF } from "@/lib/format";
import { amountIssue, limitsFor, type LimitKind } from "@/lib/limits";
import { cn } from "@/lib/cn";

const QUICK: Record<LimitKind, number[]> = {
  wallet: [1000, 5000, 10000, 25000],
  deposit: [2000, 5000, 10000, 25000],
  withdraw: [5000, 10000, 25000, 50000],
  momo: [5000, 10000, 25000, 50000],
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

/**
 * The amount is the most important number on a money screen, so it is the
 * biggest thing on it. Below it: quick amounts, limits, and the exact fee split.
 */
export function AmountField({
  value,
  onChange,
  kind,
  label = "Amount",
  receive,
  pay,
  fee,
  receiveLabel = "They receive",
  payLabel = "You pay",
  feeLabel = "Fee",
}: {
  value: string;
  onChange: (value: string) => void;
  kind: LimitKind;
  label?: string;
  receive?: number;
  pay?: number;
  fee?: number;
  receiveLabel?: string;
  payLabel?: string;
  feeLabel?: string;
}) {
  const id = useId();
  const amount = Number(value) || 0;
  const { min, max } = limitsFor(kind);
  const issue = amountIssue(amount, kind);
  const valid = Boolean(value) && !issue && amount > 0;
  const touched = value !== "";
  const charge = fee && fee > 0 ? fee : 0;

  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-bold text-ink">
        {label}
      </label>
      <div
        className={cn(
          "mt-2 flex items-baseline gap-2 border-b-2 pb-2 transition-colors",
          touched && issue ? "border-danger" : "border-line focus-within:border-brand",
        )}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={amount ? fmt(amount) : ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="0"
          aria-invalid={Boolean(touched && issue)}
          required
          className="tabular w-full min-w-0 bg-transparent font-mono text-[2.5rem] font-black leading-none tracking-tight text-ink outline-none placeholder:text-line"
        />
        <span className="text-lg font-bold text-muted">XAF</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK[kind]
          .filter((n) => n >= min && (!max || n <= max))
          .map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={cn(
                "tabular rounded-full px-3.5 py-1.5 text-[13px] font-bold transition active:scale-95",
                amount === n ? "bg-ink text-white" : "bg-paper text-ink ring-1 ring-line hover:ring-brand/40",
              )}
            >
              {fmt(n)}
            </button>
          ))}
      </div>

      {touched && issue ? (
        <p className="mt-2 text-[13px] font-semibold text-danger">{issue}</p>
      ) : (
        <p className="tabular mt-2 text-[12px] text-muted">
          {max ? `${fmt(min)} to ${fmt(max)} XAF` : `From ${fmt(min)} XAF`}
        </p>
      )}

      {receive != null ? (
        <dl
          className={cn(
            "mt-4 space-y-2 rounded-2xl bg-paper px-4 py-3.5 text-[14px] transition-opacity",
            valid ? "opacity-100" : "opacity-50",
          )}
          aria-live="polite"
        >
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{receiveLabel}</dt>
            <dd className="tabular font-semibold text-ink">{formatXAF(valid ? receive : 0)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{feeLabel}</dt>
            <dd className={cn("tabular font-semibold", charge ? "text-ink" : "text-brand-deep")}>
              {charge && valid ? formatXAF(charge) : charge ? formatXAF(0) : "Free"}
            </dd>
          </div>
          {pay != null ? (
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <dt className="font-bold text-ink">{payLabel}</dt>
              <dd className="tabular text-[16px] font-black text-ink">{formatXAF(valid ? pay : 0)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
