"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export default function KeysPage() {
  const { state } = useApp();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">API keys</h1>
      <p className="text-sm text-muted">Sandbox keys never move live money.</p>
      <div className="mt-6 space-y-4">
        {state.apiKeys.map((key) => (
          <Card key={key.env} className="bg-navy p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                {key.env} secret
              </p>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase">
                {key.env}
              </span>
            </div>
            <p className="mt-3 font-mono text-sm">{key.secretKeyMasked}</p>
            <p className="mt-4 text-xs font-bold uppercase text-white/60">Publishable</p>
            <p className="mt-1 font-mono text-sm">{key.publicKey}</p>
          </Card>
        ))}
        <Button variant="secondary">Create new key</Button>
      </div>
    </div>
  );
}
