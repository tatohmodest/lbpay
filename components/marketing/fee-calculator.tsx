"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Users } from "lucide-react";
import { FEE_RATES, depositFee, directTransferFee, feePercent, momoOutFee } from "@/lib/fees";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/cn";

const kinds = [
  {
    id: "wallet",
    label: "Wallet to wallet",
    icon: Users,
    rate: FEE_RATES.walletTransfer,
    fee: () => 0,
    receiveLabel: "They receive",
    note: "Instant, to any @handle or LBPay number. Always free.",
  },
  {
    id: "withdraw",
    label: "To MoMo",
    icon: ArrowUpRight,
    rate: FEE_RATES.withdraw,
    fee: momoOutFee,
    receiveLabel: "Lands on MTN or Orange",
    note: `From your wallet to any MTN or Orange number. ${LIMITS.momoOutMin.toLocaleString("fr-FR")} to ${LIMITS.momoOutMax.toLocaleString("fr-FR")} XAF per transfer.`,
  },
  {
    id: "deposit",
    label: "Add money",
    icon: ArrowDownLeft,
    rate: FEE_RATES.deposit,
    fee: depositFee,
    receiveLabel: "Added to your wallet",
    note: "Top up from MTN MoMo or Orange Money. Approve on your phone.",
  },
  {
    id: "cross",
    label: "MTN ↔ Orange",
    icon: ArrowLeftRight,
    rate: FEE_RATES.crossNetwork,
    fee: (n: number) => directTransferFee(n, "mtn", "orange"),
    receiveLabel: "They receive",
    note: "Quick transfer between networks, no wallet balance needed.",
  },
] as const;

const fmt = (n: number) => n.toLocaleString("fr-FR");

export function FeeCalculator({ className }: { className?: string }) {
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("withdraw");
  const [raw, setRaw] = useState("50000");
  const active = kinds.find((k) => k.id === kind)!;
  const amount = Math.min(Number(raw.replace(/\D/g, "")) || 0, 10_000_000);
  const fee = active.fee(amount);
  const total = amount + fee;

  return (
    <div className={cn("rounded-[1.75rem] bg-white p-2 shadow-[0_30px_60px_-30px_rgba(6,38,28,0.25)] ring-1 ring-line", className)}>
      <div role="tablist" aria-label="Transfer type" className="grid grid-cols-2 gap-1 rounded-[1.4rem] bg-paper p-1">
        {kinds.map((k) => (
          <button
            key={k.id}
            role="tab"
            type="button"
            aria-selected={kind === k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[1.1rem] px-2 py-2.5 text-[13px] font-semibold transition",
              kind === k.id ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            <k.icon className="h-3.5 w-3.5" />
            {k.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-7">
        <label htmlFor="fee-amount" className="text-[13px] font-medium text-muted">
          Amount
        </label>
        <div className="mt-2 flex items-baseline gap-2 border-b-2 border-line pb-2 focus-within:border-brand">
          <input
            id="fee-amount"
            value={amount ? fmt(amount) : ""}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="tabular w-full min-w-0 bg-transparent text-[2.5rem] font-bold tracking-tight text-ink outline-none placeholder:text-line md:text-5xl"
          />
          <span className="text-lg font-semibold text-muted">XAF</span>
        </div>

        <dl className="mt-6 space-y-3 text-[15px]">
          <div className="flex items-center justify-between">
            <dt className="text-muted">
              Fee <span className="tabular">({feePercent(active.rate)}%)</span>
            </dt>
            <dd className={cn("tabular font-semibold", fee === 0 ? "text-brand-deep" : "text-ink")}>
              {fee === 0 ? "Free" : `${fmt(fee)} XAF`}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">{active.receiveLabel}</dt>
            <dd className="tabular font-semibold text-ink">{fmt(amount)} XAF</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <dt className="font-semibold text-ink">You pay in total</dt>
            <dd className="tabular text-xl font-bold text-ink">{fmt(total)} XAF</dd>
          </div>
        </dl>
        <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-[13px] leading-6 text-muted">
          {active.note} The fee is shown before you enter your PIN. Nothing is hidden in the rate.
        </p>
      </div>
    </div>
  );
}
