"use client";

import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function SubscriptionsPage() {
  const { state } = useApp();
  return (
    <div>
      <h1 className="text-2xl font-black">Subscriptions</h1>
      <p className="text-sm text-muted">
        Recurring collection where the rail and applicable rules permit it.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {state.subscriptions.map((plan) => (
          <Card key={plan.id} className="p-5">
            <p className="text-xs font-bold uppercase text-muted">{plan.interval}</p>
            <h2 className="mt-1 text-xl font-bold">{plan.name}</h2>
            <p className="mt-2 font-mono text-2xl font-bold">{formatXAF(plan.amount)}</p>
            <p className="mt-2 text-sm text-muted">{plan.subscribers} subscribers</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
