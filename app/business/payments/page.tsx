"use client";

import { Card } from "@/components/ui/card";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import type { PaymentMethod, TransactionStatus } from "@/lib/types";

export default function BusinessPaymentsPage() {
  const me = useMe();
  const payments = (me.data?.transactions || []).filter((tx) =>
    ["collection", "receive", "subscription", "deposit"].includes(tx.kind),
  );

  return (
    <div>
      <h1 className="text-2xl font-black">Payments</h1>
      <p className="text-sm text-muted">All collections across MTN, Orange, card, and wallet.</p>
      <Card className="mt-6 divide-y divide-line">
        {payments.length === 0 ? (
          <p className="p-6 text-sm text-muted">No collections yet.</p>
        ) : (
          payments.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{tx.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                <MethodDot method={tx.method as PaymentMethod} />
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(tx.amount)}</p>
                <StatusBadge status={tx.status as TransactionStatus} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
