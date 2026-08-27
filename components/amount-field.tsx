"use client";

import { Field, Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { amountIssue, limitsFor, type LimitKind } from "@/lib/limits";
import { cn } from "@/lib/cn";

export function AmountField({
  value,
  onChange,
  kind,
  label = "Amount (XAF)",
  receive,
  pay,
  receiveLabel = "They receive",
  payLabel = "You pay",
}: {
  value: string;
  onChange: (value: string) => void;
  kind: LimitKind;
  label?: string;
  receive?: number;
  pay?: number;
  receiveLabel?: string;
  payLabel?: string;
}) {
  const amount = Number(value) || 0;
  const { min, max } = limitsFor(kind);
  const issue = amountIssue(amount, kind);
  const valid = Boolean(value) && !issue && amount > 0;
  const touched = value !== "";

  return (
    <div>
      <Field label={label}>
        <Input
          type="number"
          min={min}
          max={max ?? undefined}
          inputMode="numeric"
          className={cn(
            "font-mono text-lg",
            touched && issue && "border-danger focus:border-danger focus:ring-red-100",
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </Field>
      {touched && issue ? <p className="mt-2 text-sm font-semibold text-danger">{issue}</p> : null}
      {valid && receive != null ? (
        <div className="mt-3 space-y-1 rounded-2xl bg-paper px-4 py-3 text-sm">
          <p>
            {receiveLabel} <span className="font-mono font-semibold">{formatXAF(receive)}</span>
          </p>
          {pay != null ? (
            <p className="text-muted">
              {payLabel} <span className="font-mono font-semibold text-ink">{formatXAF(pay)}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
