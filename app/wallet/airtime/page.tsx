"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { MoneyForm } from "@/components/money-form";
import { useApp } from "@/lib/store";

export default function AirtimePage() {
  const { buyAirtime, state } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState(state.user.phone);
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Buy airtime & data</h1>
      <Card className="mt-6 p-6">
        <MoneyForm
          submitLabel="Buy airtime"
          extra={
            <>
              <div className="grid grid-cols-2 gap-2">
                {(["mtn", "orange"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNetwork(item)}
                    className={`rounded-xl border py-3 font-semibold uppercase ${
                      network === item ? "border-brand bg-brand-soft" : "border-line"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
            </>
          }
          onSubmit={(amount) => {
            const result = buyAirtime(amount, phone, network);
            if (result.ok) router.push("/wallet");
            return result;
          }}
        />
      </Card>
    </div>
  );
}
