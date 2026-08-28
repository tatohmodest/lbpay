"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DeveloperKeysPanel } from "@/components/developer-keys";
import { formatRelative } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";

export default function DevelopersPage() {
  const me = useMe();
  const data = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => (await fetch("/api/developer/keys")).json(),
  });
  const logs = data.data?.logs || [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-black">Developer overview</h1>
        <p className="text-muted">Keys, events, and payouts for your product.</p>
      </header>
      <div className="max-w-xl">
        <DeveloperKeysPanel />
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
              <span className="flex-1 px-3 font-semibold">
                {log.method} {log.path}
              </span>
              <span className="text-xs text-muted">{formatRelative(log.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-muted">No API calls yet. Use your sandbox or live secret on /api/v1.</p>
          ) : null}
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted">Signed in as @{me.data?.user?.lbpayId}</p>
    </div>
  );
}
