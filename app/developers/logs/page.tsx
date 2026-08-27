"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";

export default function LogsPage() {
  const data = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => (await fetch("/api/developer/keys")).json(),
  });
  const logs = data.data?.logs || [];

  return (
    <div>
      <h1 className="text-2xl font-black">Logs</h1>
      <Card className="mt-6 divide-y divide-line">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-muted">No requests yet.</p>
        ) : (
          logs.map((log: { id: string; status: number; method: string; path: string; createdAt: string }) => (
            <div key={log.id} className="flex items-center gap-4 p-4 font-mono text-sm">
              <span className={log.status >= 400 ? "font-bold text-danger" : "text-brand"}>{log.status}</span>
              <span className="font-semibold">
                {log.method} {log.path}
              </span>
              <span className="ml-auto text-xs text-muted">{formatRelative(log.createdAt)}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
