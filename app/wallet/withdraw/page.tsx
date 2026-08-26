"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MoneyForm } from "@/components/money-form";
import { useApp } from "@/lib/store";

export default function WithdrawPage() {
  const { withdraw, state } = useApp();
  const router = useRouter();
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Withdraw</h1>
      <p className="mt-1 text-sm text-muted">
        LBPay → {network.toUpperCase()}. Available {state.balance.toLocaleString()} XAF.
      </p>
      <Card className="mt-6 p-6">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["mtn", "orange"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setNetwork(item)}
              className={`rounded-xl border py-3 font-semibold uppercase ${
                network === item ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <MoneyForm
          submitLabel="Withdraw"
          onSubmit={(amount) => {
            const result = withdraw(amount, network);
            if (result.ok) router.push("/wallet");
            return result;
          }}
        />
      </Card>
    </div>
  );
}
