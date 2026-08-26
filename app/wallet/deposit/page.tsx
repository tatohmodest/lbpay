"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MoneyForm } from "@/components/money-form";
import { useApp } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

const methods: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "mtn", label: "MTN Mobile Money", hint: "MTN → LBPay" },
  { id: "orange", label: "Orange Money", hint: "Orange → LBPay" },
  { id: "card", label: "Visa / Mastercard", hint: "Card → LBPay" },
];

export default function DepositPage() {
  const { deposit } = useApp();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("mtn");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Add money</h1>
      <p className="mt-1 text-sm text-muted">Fund your LBPay wallet from Mobile Money or card.</p>
      <Card className="mt-6 p-6">
        <div className="mb-4 grid gap-2">
          {methods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMethod(item.id)}
              className={`rounded-xl border p-3 text-left ${
                method === item.id ? "border-brand bg-brand-soft" : "border-line"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </button>
          ))}
        </div>
        <MoneyForm
          submitLabel="Deposit"
          onSubmit={(amount) => {
            const result = deposit(amount, method);
            if (result.ok) router.push("/wallet");
            return result;
          }}
        />
      </Card>
    </div>
  );
}
