"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function MoneyForm({
  submitLabel,
  onSubmit,
  extra,
  defaultAmount,
}: {
  submitLabel: string;
  onSubmit: (amount: number) => { ok: boolean };
  extra?: React.ReactNode;
  defaultAmount?: string;
}) {
  const [amount, setAmount] = useState(defaultAmount ?? "");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(amount);
        const result = onSubmit(value);
        if (result.ok) setAmount("");
      }}
    >
      {extra}
      <Field label="Amount (XAF)">
        <Input
          inputMode="numeric"
          type="number"
          min={1}
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono text-lg"
          required
        />
      </Field>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
