"use client";

import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";
import { LEGAL_NOTE } from "@/lib/flags";
import { useMe } from "@/lib/hooks/wallet";

export default function SettlementsPage() {
  const me = useMe();
  const balance = me.data?.balance ?? 0;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Settlements</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted">Available to settle</p>
        <p className="mt-2 font-mono text-3xl font-bold">{formatXAF(balance)}</p>
        <p className="mt-6 text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
      </Card>
    </div>
  );
}
