"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";

export default function AdminWalletsPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
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

  return (
    <div>
      <h1 className="text-2xl font-black">Wallets</h1>
      <p className="text-sm text-muted">Credit or debit any wallet. This writes an adjustment on the ledger.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Amount (XAF)">
          <Input className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        {(wallets.data?.wallets || []).map((row: {
          balance: number;
          user: { id: string; name: string; lbpayId: string; status: string };
        }) => (
          <Card key={row.user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-bold">{row.user.name} · @{row.user.lbpayId}</p>
              <p className="font-mono text-sm">{formatXAF(row.balance)}</p>
            </div>
            <div className="flex gap-2">
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
          </Card>
        ))}
      </div>
    </div>
  );
}
