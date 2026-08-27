"use client";

import { Check } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { amountIssue, limitsFor, type LimitKind } from "@/lib/limits";
import { cn } from "@/lib/cn";

export function AmountField({
  value,
  onChange,
  kind,
  label = "Amount (XAF)",
  extra,
}: {
  value: string;
  onChange: (value: string) => void;
  kind: LimitKind;
  label?: string;
  extra?: string;
}) {
  const amount = Number(value) || 0;
  const { min, max } = limitsFor(kind);
  const issue = amountIssue(amount, kind);
  const valid = Boolean(value) && !issue && amount > 0;
  const touched = value !== "";

  return (
    <div>
      <p className="mb-3 rounded-2xl bg-paper px-4 py-3 text-sm text-ink">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
          {kind === "withdraw" ? "Withdrawal limit" : kind === "deposit" ? "Deposit limit" : "Transfer limit"}
        </span>
        <span className="mt-1 block">Minimum: {formatXAF(min)}</span>
        {max ? <span className="block">Maximum: {formatXAF(max)}</span> : null}
        {extra ? <span className="mt-1 block text-muted">{extra}</span> : null}
      </p>
      <Field label={label}>
        <div className="relative">
          <Input
            type="number"
            min={min}
            max={max ?? undefined}
            inputMode="numeric"
            className={cn(
              "font-mono text-lg",
              touched && issue && "border-danger focus:border-danger focus:ring-red-100",
              valid && "border-brand focus:border-brand",
            )}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
          />
          {valid ? <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" /> : null}
        </div>
      </Field>
      {touched && issue ? <p className="mt-2 text-sm font-semibold text-danger">{issue}</p> : null}
      {valid ? <p className="mt-2 text-sm font-semibold text-brand">Valid amount.</p> : null}
    </div>
  );
}
