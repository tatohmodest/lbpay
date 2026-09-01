"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const methods = [
  { id: "mtn", label: "MTN MoMo", hint: "670 11 22 33", tone: "bg-[#ffcc00] text-black" },
  { id: "orange", label: "Orange Money", hint: "699 44 55 66", tone: "bg-[#ff7900] text-white" },
  { id: "wallet", label: "LBPay wallet", hint: "@nkoum", tone: "bg-brand text-white" },
] as const;

export function CheckoutPreview() {
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("mtn");

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="lb-float-delayed pointer-events-none absolute -left-10 top-16 hidden w-48 rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-md lg:block">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">Ledger</p>
        <p className="mt-2 text-sm font-medium">Posted · 12,500 XAF</p>
        <p className="mt-1 text-xs text-white/60">MTN → wallet in 1.4s</p>
      </div>

      <div className="lb-float relative overflow-hidden rounded-[1.35rem] border border-white/15 bg-white shadow-[0_40px_80px_rgba(10,37,64,0.45)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Checkout
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">Café des Palmiers</p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
            Live
          </span>
        </div>
        <div className="px-5 py-5">
          <p className="text-xs text-muted">Amount due</p>
          <p className="mt-1 text-[2rem] font-semibold tracking-[-0.04em] text-ink">12,500 XAF</p>
          <div className="mt-5 space-y-2">
            {methods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  method === item.id
                    ? "border-brand/40 bg-brand-soft/60"
                    : "border-line bg-white hover:border-brand/25",
                )}
              >
                <span className={cn("grid h-8 w-8 place-items-center rounded-lg text-[9px] font-black", item.tone)}>
                  {item.id === "mtn" ? "MTN" : item.id === "orange" ? "OM" : "LB"}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="block text-xs text-muted">{item.hint}</span>
                </span>
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border",
                    method === item.id ? "border-brand bg-brand text-white" : "border-line",
                  )}
                >
                  {method === item.id ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Pay 12,500 XAF
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">PIN confirmed · XAF only</p>
        </div>
      </div>
    </div>
  );
}
