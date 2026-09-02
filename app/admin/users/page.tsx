"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppImg } from "@/components/app-img";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";

type AdminUser = {
  id: string;
  name: string;
  lbpayId: string;
  email: string;
  avatar: string;
  roles: string[];
  status: string;
  balance: number;
};

export default function AdminUsersPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await fetch("/api/admin/users")).json() as Promise<{ users: AdminUser[] }>,
  });
  const mutate = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-users"] });
      notify.success("Updated", "User record saved.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const rows = useMemo(() => {
    const list = users.data?.users || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((user) =>
      `${user.name} ${user.lbpayId} ${user.email} ${user.roles.join(" ")}`.toLowerCase().includes(needle),
    );
  }, [users.data, q]);

  return (
    <div className="space-y-4">
      <AdminHeader title="Users" copy="Freeze, restore, and grant roles." />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, or ID" />
      <AdminPanel>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          rows.map((user) => (
            <div key={user.id} className="rounded-[1.15rem] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <AppImg
                    src={user.avatar}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{user.name}</p>
                    <p className="truncate text-xs text-muted">
                      @{user.lbpayId} · {user.email}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {user.roles.join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-black">{formatXAF(user.balance, { withCurrency: false })}</p>
                  <p className={`text-[11px] font-bold uppercase ${user.status === "frozen" ? "text-danger" : "text-brand"}`}>
                    {user.status}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    mutate.mutate({ userId: user.id, action: user.status === "frozen" ? "unfreeze" : "freeze" })
                  }
                >
                  {user.status === "frozen" ? "Unfreeze" : "Freeze"}
                </Button>
                {(["business", "developer", "admin"] as const).map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      mutate.mutate({
                        userId: user.id,
                        action: user.roles.includes(role) ? "revoke" : "grant",
                        role,
                      })
                    }
                  >
                    {user.roles.includes(role) ? `Revoke ${role}` : `Grant ${role}`}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </AdminPanel>
    </div>
  );
}
