"use client";

import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { PayQR } from "@/components/qr";
import { formatDate, formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function BusinessPage() {
  const { state, createLink } = useApp();
  const [title, setTitle] = useState("Python Masterclass");
  const [amount, setAmount] = useState("25000");
  const collections = state.transactions.filter((tx) =>
    ["collection", "receive"].includes(tx.kind),
  );

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Business overview</h1>
          <p className="text-muted">{state.business.name} · real-time tools</p>
        </div>
        <Button variant="secondary">
          <Download className="h-4 w-4" /> Generate report
        </Button>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Total revenue (XAF)
            </p>
            <TrendingUp className="h-4 w-4 text-brand" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold">
            {formatXAF(state.business.revenue, { withCurrency: false })}
          </p>
          <p className="mt-2 text-sm font-semibold text-brand">+14.2% this month</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Active payment links
          </p>
          <p className="mt-3 font-mono text-3xl font-bold">{state.business.activeLinks}</p>
          <p className="mt-2 text-sm text-muted">{state.links.length} in this workspace</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Settlement status
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted">Next payout</span>
            <span className="font-mono font-bold">
              {formatXAF(state.business.nextPayout, { withCurrency: false })}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-soft">
            <div className="h-full w-3/4 rounded-full bg-brand" />
          </div>
          <p className="mt-2 text-right text-sm text-muted">{state.business.nextPayoutAt}</p>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wide">Generate payment link</h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              createLink(title, Number(amount) || null);
            }}
          >
            <Field label="Product / service title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Amount (XAF)">
              <Input
                type="number"
                className="font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 font-mono text-xs text-muted">
              lbpay.me/pay/{title.toLowerCase().replace(/\s+/g, "-")}
            </div>
            <Button type="submit" variant="secondary">
              Create link
            </Button>
          </form>
        </Card>
        <Card className="flex flex-col items-center bg-navy p-6 text-white">
          <p className="self-end rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase">
            Store: {state.business.name}
          </p>
          <h2 className="mt-4 text-2xl font-bold">Scan to pay</h2>
          <div className="mt-4">
            <PayQR value={`https://lbpay.me/pay/${state.links[0]?.slug ?? "store"}`} />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">Recent transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {collections.map((tx) => (
                <tr key={tx.id}>
                  <td className="p-3 font-mono text-xs">{tx.id}</td>
                  <td className="p-3 text-muted">{formatDate(tx.createdAt)}</td>
                  <td className="p-3">{tx.counterparty}</td>
                  <td className="p-3">
                    <MethodDot method={tx.method} />
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    {formatXAF(tx.amount, { withCurrency: false })}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
