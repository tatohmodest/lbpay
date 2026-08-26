"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";

export default function SendPage() {
  const { state, sendMoney } = useApp();
  const router = useRouter();
  const [to, setTo] = useState("@");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<"wallet" | "mtn" | "orange">("wallet");
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Send money</h1>
      <p className="mt-1 text-sm text-muted">
        Send to an LBPay ID like @{state.user.lbpayId}, or pay out to MTN / Orange.
      </p>
      <Card className="mt-6 p-6">
        <p className="mb-4 text-sm text-muted">
          Available {formatXAF(state.balance)}
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const result = sendMoney({ amount: Number(amount), to, network, note });
            if (result.ok) router.push("/wallet");
          }}
        >
          <Field label="Recipient">
            <Input
              placeholder="@modest or 6XXXXXXXX"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </Field>
          <Field label="Network">
            <div className="grid grid-cols-3 gap-2">
              {(["wallet", "mtn", "orange"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNetwork(item)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize ${
                    network === item
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-line"
                  }`}
                >
                  {item === "wallet" ? "LBPay" : item.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Amount (XAF)">
            <Input
              type="number"
              className="font-mono text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </Field>
          <Button type="submit">Send</Button>
        </form>
      </Card>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Saved people</p>
        <div className="flex flex-wrap gap-2">
          {state.beneficiaries.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => {
                setTo(person.lbpayId ? `@${person.lbpayId}` : person.phone || "");
                setNetwork(person.network ?? "wallet");
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
            >
              {person.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
