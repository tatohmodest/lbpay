"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SendWidget() {
  const [amount, setAmount] = useState("20000");
  const [to, setTo] = useState("@nkoum");
  const n = Number(amount.replace(/\D/g, "")) || 0;

  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_60px_rgba(6,38,28,0.10)] ring-1 ring-black/5">
      <p className="text-sm font-semibold text-ink">Send money</p>
      <label className="mt-5 block text-xs font-medium text-muted">You send</label>
      <div className="mt-1.5 flex items-center rounded-2xl border border-line bg-paper px-4 py-3">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="numeric"
          className="w-full bg-transparent text-lg font-semibold text-ink outline-none"
          aria-label="Amount in XAF"
        />
        <span className="text-sm font-semibold text-muted">XAF</span>
      </div>
      <label className="mt-4 block text-xs font-medium text-muted">To</label>
      <div className="mt-1.5 rounded-2xl border border-line bg-paper px-4 py-3">
        <input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-full bg-transparent text-sm font-medium text-ink outline-none"
          aria-label="Recipient handle or phone"
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">Wallet transfer fee</span>
        <span className="font-semibold text-brand-deep">0 XAF</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {n ? `${n.toLocaleString("fr-FR")} XAF` : "Enter an amount"} · PIN confirmed on send
      </p>
      <Link href="/signup" className="mt-5 block">
        <Button className="h-12 w-full rounded-2xl text-[15px]">
          Send now <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
