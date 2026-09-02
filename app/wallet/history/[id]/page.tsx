"use client";

import { use } from "react";
import Link from "next/link";
import { TxDetail } from "@/components/tx-detail";
import { useMe } from "@/lib/hooks/wallet";
import { useApp } from "@/lib/store";
import { publicTx } from "@/lib/tx";
import type { Transaction } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = use(params);
  const id = decodeURIComponent(raw || "");
  const { state } = useApp();
  const me = useMe();
  const local = ((me.data?.transactions as Transaction[] | undefined) ?? state.transactions).find(
    (row) => row.id === id,
  );
  const remote = useQuery({
    queryKey: ["tx", id],
    enabled: Boolean(id) && !local,
    queryFn: async () => {
      const res = await fetch(`/api/wallet/transactions/${encodeURIComponent(id)}`);
      const data = (await res.json()) as { transaction?: Transaction; error?: string };
      if (!res.ok || !data.transaction) throw new Error(data.error || "Not found");
      return data.transaction;
    },
  });

  const tx = local ? publicTx(local) : remote.data;

  if (!id || remote.isError) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.25rem] border border-line/80 bg-white p-8 text-center">
        <h1 className="text-xl font-black">Transaction not found</h1>
        <p className="mt-2 text-sm text-muted">This movement is not on your ledger.</p>
        <Link href="/wallet/history" className="mt-4 inline-block text-sm font-bold text-brand">
          Back to history
        </Link>
      </div>
    );
  }

  if (!tx) {
    return <p className="px-1 py-10 text-center text-sm text-muted">Opening transaction…</p>;
  }

  return <TxDetail tx={tx} />;
}
