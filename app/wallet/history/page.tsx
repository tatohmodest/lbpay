"use client";

import { Card } from "@/components/ui/card";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { Transaction } from "@/lib/types";

export default function HistoryPage() {
  const { state } = useApp();
  const me = useMe();
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;

  return (
    <div>
      <h1 className="text-2xl font-black">Transaction history</h1>
      <p className="mt-1 text-sm text-muted">A clear record of every payment.</p>
      <Card className="mt-6 overflow-hidden">
        <div className="divide-y divide-line">
          {transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No transactions yet.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{tx.counterparty}</p>
                  <p className="text-xs text-muted">
                    {tx.id} · {tx.kind} · {formatDate(tx.createdAt)}
                    {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee)}` : ""}
                  </p>
                  <div className="mt-1">
                    <MethodDot method={tx.method} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">
                    {isMoneyOut(tx.kind) ? "−" : "+"}
                    {formatXAF(tx.amount)}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
