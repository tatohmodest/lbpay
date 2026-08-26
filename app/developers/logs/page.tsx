"use client";

import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function LogsPage() {
  const { state } = useApp();
  return (
    <div>
      <h1 className="text-2xl font-black">Logs</h1>
      <Card className="mt-6 divide-y divide-line">
        {state.logs.map((log) => (
          <div key={log.id} className="flex items-center gap-4 p-4 font-mono text-sm">
            <span className={log.status >= 400 ? "font-bold text-danger" : "text-brand"}>
              {log.status}
            </span>
            <span className="font-semibold">
              {log.method} {log.path}
            </span>
            <span className="ml-auto text-xs text-muted">{formatRelative(log.createdAt)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
