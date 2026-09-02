"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export default function AdminAuditPage() {
  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => (await fetch("/api/admin/audit")).json(),
  });
  const rows = (audit.data?.audit || []) as Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    note?: string;
    createdAt: string;
  }>;

  return (
    <div className="space-y-4">
      <AdminHeader title="Audit log" copy="Every admin action is recorded here." />
      <AdminPanel>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-[1.15rem] px-3 py-3">
              <p className="font-bold">{row.action}</p>
              <p className="text-xs text-muted">
                {row.targetType}:{row.targetId} · {formatDate(row.createdAt)}
              </p>
              {row.note ? <p className="mt-1 text-sm text-ink">{row.note}</p> : null}
            </div>
          ))
        )}
      </AdminPanel>
    </div>
  );
}
