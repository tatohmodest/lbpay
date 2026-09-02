"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppImg } from "@/components/app-img";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";

export default function AdminWalletsPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [q, setQ] = useState("");
  const wallets = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => (await fetch("/api/admin/wallets")).json(),
  });
  const mutate = useMutation({
    mutationFn: (body: Record<string, string | number>) =>
      fetch("/api/admin/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-wallets"] });
      notify.moneyIn(Number(amount) || 0, "Wallet adjusted");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const rows = useMemo(() => {
    const list = (wallets.data?.wallets || []) as Array<{
      balance: number;
      user: { id: string; name: string; lbpayId: string; status: string; avatar: string };
    }>;
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((row) => `${row.user.name} ${row.user.lbpayId}`.toLowerCase().includes(needle));
  }, [wallets.data, q]);

  return (
    <div className="space-y-4">
      <AdminHeader title="Wallets" copy="Credit or debit any wallet. This writes an adjustment on the ledger." />
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Amount (XAF)">
          <Input className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ID" />
        </Field>
      </div>
      <AdminPanel>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          rows.map((row) => (
            <div key={row.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <AppImg
                  src={row.user.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold">{row.user.name}</p>
                  <p className="text-xs text-muted">@{row.user.lbpayId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm font-black">{formatXAF(row.balance, { withCurrency: false })}</p>
                <Button
                  size="sm"
                  onClick={() =>
                    mutate.mutate({ userId: row.user.id, amount: Number(amount), direction: "credit", reason })
                  }
                >
                  Credit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    mutate.mutate({ userId: row.user.id, amount: Number(amount), direction: "debit", reason })
                  }
                >
                  Debit
                </Button>
              </div>
            </div>
          ))
        )}
      </AdminPanel>
    </div>
  );
}
