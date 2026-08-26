"use client";

import { Card } from "@/components/ui/card";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function BusinessPaymentsPage() {
  const { state } = useApp();
  return (
    <div>
      <h1 className="text-2xl font-black">Payments</h1>
      <p className="text-sm text-muted">All collections across MTN, Orange, card, and wallet.</p>
      <Card className="mt-6 divide-y divide-line">
        {state.transactions
          .filter((tx) => ["collection", "receive", "subscription"].includes(tx.kind))
          .map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{tx.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                <MethodDot method={tx.method} />
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(tx.amount)}</p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}
