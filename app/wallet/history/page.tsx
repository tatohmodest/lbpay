"use client";

import { Card } from "@/components/ui/card";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function HistoryPage() {
  const { state } = useApp();
  return (
    <div>
      <h1 className="text-2xl font-black">Transaction history</h1>
      <Card className="mt-6 overflow-hidden">
        <div className="divide-y divide-line">
          {state.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{tx.counterparty}</p>
                <p className="text-xs text-muted">
                  {tx.id} · {tx.kind} · {formatDate(tx.createdAt)}
                </p>
                <div className="mt-1">
                  <MethodDot method={tx.method} />
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">{formatXAF(tx.amount)}</p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
