"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { SupportChat } from "@/components/support-chat";

export default function AdminSupportThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const detail = useQuery({
    queryKey: ["admin-support", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/support/${id}`);
      const data = (await res.json()) as {
        error?: string;
        thread?: {
          user?: { name: string; lbpayId: string; email: string } | null;
        };
      };
      if (!res.ok) throw new Error(data.error || "Conversation not found.");
      return data;
    },
  });
  const user = detail.data?.thread?.user;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <AdminHeader
        title={user?.name || "Conversation"}
        copy={user ? `@${user.lbpayId} · ${user.email}` : "Reply in the app. They also get an email."}
        action={
          <Link href="/admin/support" className="text-sm font-bold text-brand">
            Inbox
          </Link>
        }
      />
      {detail.isError ? (
        <AdminPanel>
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        </AdminPanel>
      ) : (
        <SupportChat
          endpoint={`/api/admin/support/${id}`}
          emptyTitle="None"
          emptyCopy="No messages yet."
          composerLabel="Reply"
          mine="admin"
        />
      )}
    </div>
  );
}
