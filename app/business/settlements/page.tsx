"use client";

import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";
import { LEGAL_NOTE } from "@/lib/flags";
import { useApp } from "@/lib/store";

export default function SettlementsPage() {
  const { state } = useApp();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Settlements</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted">Next payout</p>
        <p className="mt-2 font-mono text-3xl font-bold">{formatXAF(state.business.nextPayout)}</p>
        <p className="mt-1 text-sm text-brand">{state.business.nextPayoutAt}</p>
        <p className="mt-6 text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
      </Card>
      <Card className="mt-4 p-6">
        <h2 className="font-bold">Marketplace splits (architecture)</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`Customer 100,000
  → Marketplace
     ├── Seller A 70,000
     ├── Seller B 20,000
     └── Platform 10,000`}
        </pre>
      </Card>
    </div>
  );
}
