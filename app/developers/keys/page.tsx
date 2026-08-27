"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";

export default function KeysPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const data = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => (await fetch("/api/developer/keys")).json(),
  });
  const create = useMutation({
    mutationFn: (env: "sandbox" | "live") =>
      fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json;
      }),
    onSuccess: (json) => {
      client.invalidateQueries({ queryKey: ["dev-keys"] });
      notify.success("Copy this secret now", json.secret);
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">API keys</h1>
      <p className="text-sm text-muted">
        Sandbox keys never move live money. Live keys appear only after developer KYC is approved.
      </p>
      {!data.data?.liveReady ? (
        <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm">Live environment is locked pending KYC.</p>
      ) : null}
      <div className="mt-6 space-y-4">
        {(data.data?.keys || []).map((key: { id: string; env: string; publicKey: string; secretMasked: string }) => (
          <Card key={key.id} className="bg-navy p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-white/60">{key.env} secret</p>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase">{key.env}</span>
            </div>
            <p className="mt-3 font-mono text-sm">{key.secretMasked}</p>
            <p className="mt-4 text-xs font-bold uppercase text-white/60">Publishable</p>
            <p className="mt-1 font-mono text-sm">{key.publicKey}</p>
          </Card>
        ))}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => create.mutate("sandbox")}>
            Create sandbox key
          </Button>
          <Button onClick={() => create.mutate("live")} disabled={!data.data?.liveReady}>
            Create live key
          </Button>
        </div>
      </div>
    </div>
  );
}
