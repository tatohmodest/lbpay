"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function PayoutsPage() {
  const { state, createPayout } = useApp();
  const [amount, setAmount] = useState("50000");
  const [phone, setPhone] = useState("650987654");
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">Payouts</h1>
        <p className="text-sm text-muted">Send money programmatically to MTN or Orange.</p>
        <Card className="mt-6 p-6">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              createPayout(Number(amount), phone, network);
            }}
          >
            <Field label="Amount (XAF)">
              <Input type="number" className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
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
            <Button type="submit">Queue payout</Button>
          </form>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`POST /v1/payouts
{
  "amount": ${amount || 0},
  "phone": "${phone}",
  "network": "${network.toUpperCase()}"
}`}
          </pre>
        </Card>
      </div>
      <Card className="divide-y divide-line self-start">
        {state.payouts.map((payout) => (
          <div key={payout.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{payout.phone}</p>
              <p className="text-xs text-muted">
                {payout.network.toUpperCase()} · {formatDate(payout.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">{formatXAF(payout.amount)}</p>
              <StatusBadge status={payout.status} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
