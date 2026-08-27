"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";

export default function DevelopersPage() {
  const me = useMe();
  const notify = useNotify();
  const client = useQueryClient();
  const data = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => (await fetch("/api/developer/keys")).json(),
  });
  const rotate = useMutation({
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
      notify.success("Key created", json.secret);
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const liveReady = data.data?.liveReady;
  const keys = data.data?.keys || [];
  const logs = data.data?.logs || [];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Developer overview</h1>
          <p className="text-muted">
            Sandbox is for testing. Live keys move real money after KYC approval.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${liveReady ? "bg-brand text-white" : "bg-paper text-muted"}`}>
          {liveReady ? "Live enabled" : "Sandbox only"}
        </span>
      </header>
      {!liveReady ? (
        <Card className="mb-4 border-brand/30 bg-brand-soft p-4 text-sm">
          Live API access is locked until an admin approves your developer KYC photos (ID front, back,
          and you holding the document).
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {keys.map((key: { id: string; env: string; publicKey: string; secretMasked: string }) => (
          <Card key={key.id} className="bg-navy p-5 text-white">
            <p className="text-xs font-bold uppercase text-white/60">{key.env}</p>
            <p className="mt-2 font-mono text-xs">{key.publicKey}</p>
            <p className="mt-2 font-mono text-xs">{key.secretMasked}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => rotate.mutate("sandbox")}>
          New sandbox key
        </Button>
        <Button onClick={() => rotate.mutate("live")} disabled={!liveReady}>
          New live key
        </Button>
      </div>
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-xs font-bold uppercase text-muted">Recent logs</h2>
          <Link href="/developers/logs" className="text-xs font-bold uppercase text-brand">
            View all
          </Link>
        </div>
        <div className="divide-y divide-line font-mono text-sm">
          {logs.slice(0, 6).map((log: { id: string; status: number; method: string; path: string; createdAt: string }) => (
            <div key={log.id} className="flex items-center justify-between p-3">
              <span className={log.status >= 400 ? "font-bold text-danger" : "text-muted"}>{log.status}</span>
              <span className="flex-1 px-3 font-semibold">{log.method} {log.path}</span>
              <span className="text-xs text-muted">{formatRelative(log.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="p-4 text-sm text-muted">No API calls yet. Use your sandbox secret on /api/v1.</p> : null}
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted">Signed in as @{me.data?.user?.lbpayId}</p>
    </div>
  );
}
