"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export default function AdminAuditPage() {
  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => (await fetch("/api/admin/audit")).json(),
  });

  return (
    <div>
      <h1 className="text-2xl font-black">Audit log</h1>
      <Card className="mt-6 divide-y divide-line">
        {(audit.data?.audit || []).map((row: {
          id: string;
          action: string;
          targetType: string;
          targetId: string;
          note?: string;
          createdAt: string;
        }) => (
          <div key={row.id} className="p-4">
            <p className="font-semibold">{row.action}</p>
            <p className="text-xs text-muted">
              {row.targetType}:{row.targetId} · {formatDate(row.createdAt)}
            </p>
            {row.note ? <p className="mt-1 text-sm">{row.note}</p> : null}
          </div>
        ))}
      </Card>
    </div>
  );
}
