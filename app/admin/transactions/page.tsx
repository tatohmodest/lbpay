"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import type { TransactionStatus } from "@/lib/types";

export default function AdminTxPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const [q, setQ] = useState("");
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

  const rows = (txs.data?.transactions || []).filter((tx: { id: string; counterparty: string; note?: string }) => {
    const hay = `${tx.id} ${tx.counterparty} ${tx.note || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-2xl font-black">Transaction fixes</h1>
      <p className="text-sm text-muted">Reverse, cancel, or mark status. Every action needs a reason.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, counterparty…" />
        </Field>
        <Field label="Reason for the next action">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        {rows.slice(0, 40).map((tx: {
          id: string;
          kind: string;
          amount: number;
          status: TransactionStatus;
          counterparty: string;
          createdAt: string;
          userId: string;
        }) => (
          <Card key={tx.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted">{tx.id}</p>
                <p className="font-semibold">{tx.kind} · {tx.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(tx.amount)}</p>
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
                  Mark {status}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
