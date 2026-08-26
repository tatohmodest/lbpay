"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function WalletLinksPage() {
  const { state, createLink } = useApp();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black">Payment links</h1>
      <Card className="mt-6 p-6">
        <form
          className="grid gap-3 md:grid-cols-[1fr_140px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            createLink(title, amount ? Number(amount) : null);
            setTitle("");
            setAmount("");
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
        {state.links.map((link) => (
          <Card key={link.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{link.title}</p>
              <p className="font-mono text-xs text-muted">lbpay.me/pay/{link.slug}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">
                {link.amount ? formatXAF(link.amount) : "Open"}
              </p>
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
