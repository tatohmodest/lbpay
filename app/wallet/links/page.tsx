"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";

export default function WalletLinksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const data = useQuery({
    queryKey: ["wallet-links"],
    queryFn: async () => (await fetch("/api/wallet/links")).json(),
  });
  const create = useMutation({
    mutationFn: () =>
      fetch("/api/wallet/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount: amount ? Number(amount) : null }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      setTitle("");
      setAmount("");
      notify.success("Link created", "Share the checkout page.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black">Payment links</h1>
      <Card className="mt-6 p-6">
        <form
          className="grid gap-3 md:grid-cols-[1fr_140px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Amount">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>
      <div className="mt-4 space-y-3">
        {(data.data?.links || []).map((link: { id: string; title: string; slug: string; amount: number | null }) => (
          <Card key={link.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{link.title}</p>
              <p className="font-mono text-xs text-muted">/pay/{link.slug}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{link.amount ? formatXAF(link.amount) : "Open"}</p>
              <Link href={`/pay/${link.slug}`} className="text-sm font-bold text-brand">
                Open checkout
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
