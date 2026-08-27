"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";

export default function AdminUsersPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await fetch("/api/admin/users")).json(),
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

  return (
    <div>
      <h1 className="text-2xl font-black">Users</h1>
      <p className="text-sm text-muted">Freeze, unfreeze, and grant roles.</p>
      <div className="mt-6 space-y-3">
        {(users.data?.users || []).map((user: {
          id: string;
          name: string;
          lbpayId: string;
          email: string;
          roles: string[];
          status: string;
          balance: number;
        }) => (
          <Card key={user.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{user.name} · @{user.lbpayId}</p>
                <p className="text-xs text-muted">{user.email}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-brand">{user.roles.join(" · ")}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(user.balance)}</p>
                <p className={`text-xs font-bold uppercase ${user.status === "frozen" ? "text-danger" : "text-muted"}`}>
                  {user.status}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => mutate.mutate({ userId: user.id, action: user.status === "frozen" ? "unfreeze" : "freeze" })}
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
          </Card>
        ))}
      </div>
    </div>
  );
}
