"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { StatusBadge } from "@/components/ui/badge";
import { formatXAF } from "@/lib/format";

export default function RequestPage() {
  const { state, createRequest } = useApp();
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState<string | null>(null);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">Request money</h1>
        <p className="mt-1 text-sm text-muted">
          Share a request. They pay with MTN, Orange, wallet, or card.
        </p>
        <Card className="mt-6 p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const { id } = createRequest(toName, Number(amount), message);
              setLink(`${window.location.origin}/r/${id}`);
            }}
          >
            <Field label="From">
              <Input
                placeholder="Modest, a phone number, or @handle"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
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
            <Field label="Message">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>
            <Button type="submit">Create request</Button>
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
          {state.requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{req.toName}</p>
                <p className="text-xs text-muted">{req.message}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">{formatXAF(req.amount)}</p>
                <StatusBadge status={req.status === "paid" ? "success" : "pending"} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
