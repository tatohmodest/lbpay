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
    onSuccess: (data, vars) => {
      client.invalidateQueries({ queryKey: ["admin-tx"] });
      client.invalidateQueries({ queryKey: ["admin-overview"] });
      if (vars.action === "resend_webhook") {
        if (data?.delivered > 0) {
          notify.success(
            "Webhook sent",
            `Delivered ${data.event} (${data.delivered}/${data.matched} endpoints returned 2xx).`,
          );
        } else {
          notify.error("Webhook endpoint failed", data?.deliveries?.[0]?.error || "Endpoint did not return 2xx.");
        }
        return;
      }
      notify.success(
        vars.action === "delete" ? "Transaction deleted" : "Transaction updated",
        vars.action === "delete"
          ? "The transaction record was removed. Wallet balances were not changed; the action is recorded in audit."
          : "The ledger change is recorded in audit.",
      );
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
      user?: { name: string; lbpayId: string } | null;
      counterpartyUser?: { name: string; lbpayId: string } | null;
    }>;
    const needle = q.trim().toLowerCase();
    return list.filter((tx) =>
      `${tx.id} ${tx.counterparty} ${tx.note || ""} ${tx.kind} ${tx.user?.name || ""} ${tx.user?.lbpayId || ""} ${tx.counterpartyUser?.name || ""} ${tx.counterpartyUser?.lbpayId || ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [txs.data, q]);

  return (
    <div className="space-y-4">
      <AdminHeader title="Transactions" copy="Review who sent and received money, fix transaction status, or remove a settled record. Every action needs a reason." />
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
                  <p className="text-xs font-semibold text-ink">
                    {tx.user ? `${tx.user.name} (@${tx.user.lbpayId})` : "Unknown account"}
                    {tx.counterpartyUser ? ` → ${tx.counterpartyUser.name} (@${tx.counterpartyUser.lbpayId})` : ""}
                  </p>
                  <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-black">{formatXAF(tx.amount, { withCurrency: false })}</p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(tx.kind === "collection" || tx.kind === "payout" || tx.kind === "receive") && tx.status !== "pending" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={mutate.isPending}
                    onClick={() => mutate.mutate({ id: tx.id, action: "resend_webhook", reason: reason || "Admin webhook replay" })}
                  >
                    Resend webhook
                  </Button>
                ) : null}
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
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  disabled={tx.status === "pending" || mutate.isPending}
                  title={tx.status === "pending" ? "Settle before deleting" : "Delete this transaction record without changing balances"}
                  onClick={() => {
                    if (!reason.trim()) {
                      notify.error("Reason required", "Enter a reason before deleting a transaction.");
                      return;
                    }
                    if (
                      window.confirm(
                        `Delete transaction ${tx.id}? This only removes the record; it will not change wallet balances.`,
                      )
                    ) {
                      mutate.mutate({ id: tx.id, action: "delete", reason: reason.trim() });
                    }
                  }}
                >
                  Delete record
                </Button>
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
