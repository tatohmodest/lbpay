"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { kindTitle } from "@/lib/tx";
import { useNotify } from "@/lib/notify";
import type { TransactionStatus } from "@/lib/types";
import { Suspense } from "react";

function AdminTxInner() {
  const notify = useNotify();
  const client = useQueryClient();
  const searchParams = useSearchParams();
  const [reason, setReason] = useState("");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const txs = useQuery({
    queryKey: ["admin-tx"],
    queryFn: async () => (await fetch("/api/admin/transactions")).json(),
  });
  const mutate = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-tx"] });
      notify.success("Transaction updated", "The ledger change is recorded in audit.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const rows = useMemo(() => {
    const list = (txs.data?.transactions || []) as Array<{
      id: string;
      kind: string;
      amount: number;
      status: TransactionStatus;
      counterparty: string;
      createdAt: string;
      note?: string;
    }>;
    const needle = q.trim().toLowerCase();
    return list.filter((tx) => `${tx.id} ${tx.counterparty} ${tx.note || ""} ${tx.kind}`.toLowerCase().includes(needle));
  }, [txs.data, q]);

  return (
    <div className="space-y-4">
      <AdminHeader title="Transactions" copy="Reverse, cancel, or mark status. Every action needs a reason." />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, name, or kind" />
        </Field>
        <Field label="Reason for the next action">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </Field>
      </div>
      <AdminPanel>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          rows.slice(0, 40).map((tx) => (
            <div key={tx.id} className="rounded-[1.15rem] px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-muted">{tx.id}</p>
                  <p className="truncate font-bold">
                    {kindTitle(tx.kind)} · {tx.counterparty}
                  </p>
                  <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-black">{formatXAF(tx.amount, { withCurrency: false })}</p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => mutate.mutate({ id: tx.id, action: "reverse", reason })}>
                  Reverse
                </Button>
                {(["success", "failed", "cancelled"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="ghost"
                    onClick={() => mutate.mutate({ id: tx.id, action: "status", status, reason })}
                  >
                    Mark {status === "success" ? "paid" : status}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </AdminPanel>
    </div>
  );
}

export default function AdminTxPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Opening transactions…</p>}>
      <AdminTxInner />
    </Suspense>
  );
}
