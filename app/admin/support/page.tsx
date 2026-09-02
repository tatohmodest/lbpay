"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { supportPreview } from "@/lib/support";

type Thread = {
  id: string;
  status: string;
  updatedAt: string;
  unread: number;
  lastMessage?: { body: string; author: string } | null;
  user?: { name: string; lbpayId: string; email: string } | null;
};

export default function AdminSupportPage() {
  const inbox = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support");
      const data = (await res.json()) as { threads?: Thread[]; unread?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load inbox.");
      return data;
    },
    refetchInterval: 12_000,
  });
  const threads = inbox.data?.threads || [];

  return (
    <div className="space-y-4">
      <AdminHeader
        title="Chat with us"
        copy="People write from Profile. Their message is emailed to admin, and you reply here."
      />
      {threads.length === 0 ? (
        <AdminPanel>
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        </AdminPanel>
      ) : (
        <AdminPanel>
          <div className="divide-y divide-line">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/admin/support/${thread.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-paper"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {thread.user?.name || "LBPay user"}
                    {thread.unread > 0 ? (
                      <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    @{thread.user?.lbpayId} · {thread.user?.email}
                  </p>
                  <p className="mt-1 truncate text-sm text-ink">
                    {thread.lastMessage ? supportPreview(thread.lastMessage.body, 80) : "None"}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted">{formatDate(thread.updatedAt)}</p>
              </Link>
            ))}
          </div>
        </AdminPanel>
      )}
    </div>
  );
}
