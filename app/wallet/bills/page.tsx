"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MoneyForm } from "@/components/money-form";
import { useApp } from "@/lib/store";

const billers = ["ENEO", "CAMWATER", "Canal+", "Camtel Internet"];

export default function BillsPage() {
  const { payBill } = useApp();
  const router = useRouter();
  const [biller, setBiller] = useState(billers[0]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Pay bills</h1>
      <Card className="mt-6 p-6">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {billers.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBiller(item)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                biller === item ? "border-brand bg-brand-soft" : "border-line"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <MoneyForm
          submitLabel={`Pay ${biller}`}
          onSubmit={(amount) => {
            const result = payBill(amount, biller);
            if (result.ok) router.push("/wallet");
            return result;
          }}
        />
      </Card>
    </div>
  );
}
