"use client";

import { HistoryLedger } from "@/components/history-ledger";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { Transaction } from "@/lib/types";

export default function HistoryPage() {
  const { state } = useApp();
  const me = useMe();
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;

  return <HistoryLedger transactions={transactions} />;
}
