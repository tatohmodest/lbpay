"use client";

import { use, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initialState } from "@/lib/demo/seed";
import { formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function RequestPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state } = useApp();
  const req =
    state.requests.find((item) => item.id === id) ?? initialState.requests[0];
  const [paid, setPaid] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4">
      <Card className="w-full max-w-md p-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-muted">
          Payment request
        </p>
        <h1 className="mt-2 text-center text-xl font-bold">
          {req?.message || "Pay Modest"}
        </h1>
        <p className="mt-3 text-center font-mono text-4xl font-black text-brand">
          {formatXAF(req?.amount ?? 50_000)}
        </p>
        {paid ? (
          <p className="mt-6 text-center text-sm font-semibold text-brand">Paid. Thank you.</p>
        ) : (
          <Button className="mt-6 w-full" onClick={() => setPaid(true)}>
            <Lock className="h-4 w-4" /> Pay now
          </Button>
        )}
        <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5" /> Secured by LBPay
        </p>
      </Card>
    </main>
  );
}
