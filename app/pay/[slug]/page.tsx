"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const link = useQuery({
    queryKey: ["pay", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pay/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      return data as {
        link: { title: string; amount: number | null };
        merchant: { name: string } | null;
      };
    },
  });
  const [method, setMethod] = useState("mtn");
  const [paid, setPaid] = useState(false);
  const amount = link.data?.link.amount ?? 0;

  if (link.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-black">Link not found</h1>
          <p className="mt-2 text-sm text-muted">This payment link is missing or inactive.</p>
        </Card>
      </main>
    );
  }

  if (paid) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="max-w-sm p-8 text-center">
          <p className="text-sm font-bold uppercase text-brand">Paid</p>
          <h1 className="mt-2 text-2xl font-black">{formatXAF(amount)}</h1>
          <p className="mt-2 text-sm text-muted">
            {link.data?.link.title} is confirmed.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-2xl font-black text-brand">LBPay</p>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand" />
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-muted">
            {link.data?.merchant?.name || "Payment request"}
          </p>
          <h1 className="mt-2 text-center text-xl font-bold">{link.data?.link.title || "…"}</h1>
          <p className="mt-3 text-center font-mono text-4xl font-black text-brand">
            {amount ? formatXAF(amount, { withCurrency: false }) : "Open"}
            <span className="ml-1 align-super text-sm font-semibold text-muted">XAF</span>
          </p>
          <div className="mt-6 space-y-2">
            {[
              { id: "mtn", label: "MTN Mobile Money", tone: "bg-mtn text-black" },
              { id: "orange", label: "Orange Money", tone: "bg-om text-white" },
              { id: "wallet", label: "LBPay Wallet", tone: "bg-brand text-white" },
              { id: "card", label: "Visa / Mastercard", tone: "bg-navy text-white" },
            ].map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${
                  method === item.id ? "border-brand bg-brand-soft" : "border-line"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-[10px] font-black ${item.tone}`}>
                    {item.id === "mtn" ? "MTN" : item.id === "orange" ? "OM" : item.id === "card" ? "CARD" : "LB"}
                  </span>
                  {item.label}
                </span>
                <input
                  type="radio"
                  name="method"
                  checked={method === item.id}
                  onChange={() => setMethod(item.id)}
                />
              </label>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => setPaid(true)} disabled={!amount}>
            <Lock className="h-4 w-4" /> Pay {amount ? formatXAF(amount) : ""}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by LBPay
          </p>
        </Card>
      </div>
    </main>
  );
}
