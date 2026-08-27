"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";
import { formatXAF } from "@/lib/format";

export default function RequestPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const data = useQuery({
    queryKey: ["wallet-links"],
    queryFn: async () => (await fetch("/api/wallet/links")).json(),
  });
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/wallet/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Money request", amount: amount ? Number(amount) : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create request");
      return json as { link: { slug: string; title: string; amount: number | null; id: string } };
    },
    onSuccess: (json) => {
      const href = `${window.location.origin}/pay/${json.link.slug}`;
      setLink(href);
      setTitle("");
      setAmount("");
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      notify.success("Request ready", "Share the checkout link.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">Request money</h1>
        <p className="mt-1 text-sm text-muted">
          Share a checkout link. They pay with MTN, Orange, wallet, or card.
        </p>
        <Card className="mt-6 p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Field label="What is this for">
              <Input
                placeholder="Name, @handle, or reason"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field label="Amount (XAF)">
              <Input
                type="number"
                className="font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" disabled={create.isPending}>
              Create request
            </Button>
          </form>
          {link ? (
            <p className="mt-4 break-all rounded-xl bg-brand-soft p-3 font-mono text-xs text-brand-dark">
              {link}
            </p>
          ) : null}
        </Card>
      </div>
      <div>
        <Image
          src="/illustrations/request-money.png"
          alt=""
          width={900}
          height={600}
          className="mb-4 h-48 w-full rounded-3xl object-cover"
        />
        <Card className="divide-y divide-line">
          {(data.data?.links || []).length === 0 ? (
            <p className="p-6 text-sm text-muted">No requests yet.</p>
          ) : (
            (data.data?.links || []).map(
              (item: { id: string; title: string; amount: number | null; slug: string }) => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="font-mono text-xs text-muted">/pay/{item.slug}</p>
                  </div>
                  <p className="font-mono text-sm font-bold">
                    {item.amount ? formatXAF(item.amount) : "Open"}
                  </p>
                </div>
              ),
            )
          )}
        </Card>
      </div>
    </div>
  );
}
