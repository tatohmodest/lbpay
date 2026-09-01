"use client";

import Link from "next/link";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { contactFromTransaction, contactSendHref } from "@/lib/contacts";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { Transaction } from "@/lib/types";

export default function HistoryPage() {
  const { state } = useApp();
  const me = useMe();
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Activity</p>
      <h1 className="mt-1 text-2xl font-black">History</h1>
      <p className="mt-1 text-sm text-muted">Every payment on your ledger.</p>
      <div className="mt-6 overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {transactions.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">None</p>
        ) : (
          <div className="space-y-0.5">
            {transactions.map((tx) => (
              <HistoryRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ tx }: { tx: Transaction }) {
  const contact = contactFromTransaction(tx);
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-bold">{tx.counterparty}</p>
        <p className="text-xs text-muted">
          {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
          {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
        </p>
        <div className="mt-1">
          <MethodDot method={tx.method} />
        </div>
      </div>
      <div className="ml-2 shrink-0 text-right">
        <p className="font-mono text-sm font-black">
          {isMoneyOut(tx.kind) ? "−" : "+"}
          {formatXAF(tx.amount, { withCurrency: false })}
        </p>
        <StatusBadge status={tx.status} />
      </div>
    </div>
  );

  if (!contact) return body;
  return (
    <Link href={contactSendHref(contact)} className="block rounded-2xl transition hover:bg-paper">
      {body}
    </Link>
  );
}
