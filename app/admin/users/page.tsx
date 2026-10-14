"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Crown } from "lucide-react";
import { AppImg } from "@/components/app-img";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { ADMIN_SCOPES, ADMIN_SCOPE_INFO } from "@/lib/roles";
import { cn } from "@/lib/cn";

type AdminUser = {
  id: string;
  name: string;
  lbpayId: string;
  email: string;
  avatar: string;
  roles: string[];
  status: string;
  balance: number;
  owner?: boolean;
  adminScopes?: string[];
};

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersInner />
    </Suspense>
  );
}

function UsersInner() {
  const notify = useNotify();
  const client = useQueryClient();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<"all" | "staff" | "business" | "developer" | "frozen">("all");
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () =>
      (await fetch("/api/admin/users")).json() as Promise<{ users: AdminUser[]; viewer?: { id: string; owner: boolean } }>,
  });
  const viewerOwner = Boolean(users.data?.viewer?.owner);
  const mutate = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
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
    const list = (users.data?.users || []).filter((user) =>
      filter === "all"
        ? true
        : filter === "staff"
          ? user.roles.includes("admin")
          : filter === "frozen"
            ? user.status === "frozen"
            : user.roles.includes(filter),
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((user) =>
      `${user.name} ${user.lbpayId} ${user.email} ${user.roles.join(" ")}`.toLowerCase().includes(needle),
    );
  }, [users.data, q, filter]);

  return (
    <div className="space-y-4">
      <AdminHeader title="Users" copy="Freeze, restore, grant roles and staff permissions." />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, or ID" />
      <div className="flex flex-wrap gap-1.5">
        {(["all", "staff", "business", "developer", "frozen"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-bold capitalize transition",
              filter === key ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink",
            )}
          >
            {key}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted">{rows.length} shown</span>
      </div>
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
                    <p className="flex items-center gap-1.5 truncate font-bold">
                      {user.name}
                      {user.owner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                          <Crown className="h-3 w-3" /> Owner
                        </span>
                      ) : null}
                    </p>
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
              {user.roles.includes("admin") && !user.owner ? (
                <div className="mt-3 rounded-2xl bg-paper p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Staff permissions {viewerOwner ? "· tap to switch" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ADMIN_SCOPES.map((scope) => {
                      const on = (user.adminScopes || []).includes(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          disabled={!viewerOwner || mutate.isPending}
                          title={ADMIN_SCOPE_INFO[scope].copy}
                          onClick={() =>
                            mutate.mutate({
                              userId: user.id,
                              action: "scopes",
                              scopes: on
                                ? (user.adminScopes || []).filter((x) => x !== scope)
                                : [...(user.adminScopes || []), scope],
                            })
                          }
                          className={cn(
                            "rounded-full px-3 py-1 text-[12px] font-bold transition disabled:cursor-default",
                            on ? "bg-brand text-white" : "bg-white text-muted ring-1 ring-line",
                          )}
                        >
                          {on ? "✓ " : ""}
                          {ADMIN_SCOPE_INFO[scope].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
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
                {(viewerOwner ? (["business", "developer", "admin"] as const) : (["business", "developer"] as const)).map((role) => (
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
