"use client";

import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { BusinessPageHeader } from "@/components/business/page-header";
import { formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import type { PaymentMethod, TransactionStatus } from "@/lib/types";

export default function BusinessPaymentsPage() {
  const me = useMe();
  const payments = (me.data?.transactions || []).filter((tx) =>
    ["collection", "receive", "subscription", "deposit"].includes(tx.kind),
  );

  return (
    <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-3xl">
      <BusinessPageHeader title="Sales" copy="Every payment from MTN, Orange, cards, and wallet." />
      <div className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {payments.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">None</p>
        ) : (
          payments.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{tx.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                <MethodDot method={tx.method as PaymentMethod} />
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-black">{formatXAF(tx.amount, { withCurrency: false })}</p>
                <StatusBadge status={tx.status as TransactionStatus} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
