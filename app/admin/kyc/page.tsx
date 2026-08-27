"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useNotify } from "@/lib/notify";
import { useState } from "react";

export default function AdminKycPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const apps = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: async () => (await fetch("/api/admin/kyc")).json(),
  });
  const mutate = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-kyc"] });
      notify.success("KYC updated", "The account access has changed.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-black">KYC review</h1>
      <p className="text-sm text-muted">Approve business access and live developer keys.</p>
      <div className="mt-6 space-y-3">
        {(apps.data?.applications || []).map((app: {
          id: string;
          track: string;
          status: string;
          legalName: string;
          idNumber: string;
          businessName?: string;
          user?: { name: string; lbpayId: string; email: string };
        }) => (
          <Card key={app.id} className="p-5">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand">{app.track} · {app.status}</p>
                <p className="mt-1 font-bold">{app.user?.name} · @{app.user?.lbpayId}</p>
                <p className="text-xs text-muted">{app.user?.email}</p>
                <p className="mt-2 text-sm">ID {app.idNumber} · {app.legalName}</p>
                {app.businessName ? <p className="text-sm text-muted">{app.businessName}</p> : null}
              </div>
            </div>
            {app.status === "pending" ? (
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <Field label="Review note">
                  <Input
                    value={notes[app.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                  />
                </Field>
                <div className="flex items-end gap-2">
                  <Button onClick={() => mutate.mutate({ id: app.id, decision: "approve", note: notes[app.id] || "" })}>
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => mutate.mutate({ id: app.id, decision: "reject", note: notes[app.id] || "" })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
