"use client";

import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/store";

export default function WebhooksPage() {
  const { state } = useApp();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Webhooks</h1>
      <div className="mt-6 space-y-3">
        {state.webhooks.map((hook) => (
          <Card key={hook.id} className="p-5">
            <p className="font-mono text-sm">{hook.url}</p>
            <p className="mt-2 text-xs text-muted">{hook.events.join(" · ")}</p>
            <p className="mt-2 text-xs font-bold uppercase text-brand">{hook.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
