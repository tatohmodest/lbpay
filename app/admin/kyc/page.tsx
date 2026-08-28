"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useNotify } from "@/lib/notify";
import { businessKindLabel } from "@/lib/kyc";
import { useState } from "react";

type KycApp = {
  id: string;
  track: string;
  status: string;
  legalName: string;
  idNumber: string;
  businessName?: string;
  businessKind?: string;
  taxId?: string;
  note?: string;
  documentType?: string;
  website?: string;
  documents?: {
    idFrontUrl?: string;
    idBackUrl?: string;
    selfieUrl?: string;
  };
  user?: { name: string; lbpayId: string; email: string };
};

function DocThumb({ url, label }: { url?: string; label: string }) {
  if (!url) {
    return (
      <div className="rounded-xl bg-paper p-4 text-center text-xs text-muted">
        {label}: missing
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-36 w-full rounded-xl object-cover" />
      <span className="mt-1 block text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
    </a>
  );
}

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
      <p className="text-sm text-muted">
        Check personal ID photos. For business, approve small or branded shops. Tax ID is optional.
      </p>
      <div className="mt-6 space-y-3">
        {(apps.data?.applications || []).map((app: KycApp) => (
          <Card key={app.id} className="p-5">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand">
                  {app.track} · {app.status}
                  {app.track === "business" && app.businessKind
                    ? ` · ${app.businessKind}`
                    : app.documentType
                      ? ` · ${app.documentType.replace("_", " ")}`
                      : ""}
                </p>
                <p className="mt-1 font-bold">
                  {app.user?.name} · @{app.user?.lbpayId}
                </p>
                <p className="text-xs text-muted">{app.user?.email}</p>
                {app.track === "business" ? (
                  <>
                    <p className="mt-2 text-sm font-semibold">
                      {businessKindLabel(app.businessKind)}
                      {app.businessName ? ` · ${app.businessName}` : ""}
                    </p>
                    {app.note ? <p className="text-sm text-muted">{app.note}</p> : null}
                    {app.taxId ? (
                      <p className="text-sm text-muted">Tax ID {app.taxId}</p>
                    ) : app.businessKind === "branded" ? (
                      <p className="text-sm text-muted">No tax ID given</p>
                    ) : null}
                    {app.website ? <p className="text-sm text-muted">{app.website}</p> : null}
                    <p className="mt-1 text-xs text-muted">Person already verified · {app.legalName}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm">
                      ID {app.idNumber} · {app.legalName}
                    </p>
                    {app.businessName ? <p className="text-sm text-muted">{app.businessName}</p> : null}
                    {app.website ? <p className="text-sm text-muted">{app.website}</p> : null}
                  </>
                )}
              </div>
            </div>
            {app.documents ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <DocThumb url={app.documents.idFrontUrl} label="Front" />
                <DocThumb url={app.documents.idBackUrl} label="Back" />
                <DocThumb url={app.documents.selfieUrl} label="Holding ID" />
              </div>
            ) : app.track === "business" ? (
              <p className="mt-3 text-sm text-muted">Uses the personal ID already on file.</p>
            ) : (
              <p className="mt-3 text-sm text-muted">No identity photos on this application.</p>
            )}
            {app.status === "pending" || app.status === "approved" ? (
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <Field label="Review note">
                  <Input
                    value={notes[app.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                  />
                </Field>
                <div className="flex items-end gap-2">
                  <Button onClick={() => mutate.mutate({ id: app.id, decision: "approve", note: notes[app.id] || "" })}>
                    {app.status === "approved" ? "Give access" : "Approve"}
                  </Button>
                  {app.status === "pending" ? (
                    <Button
                      variant="secondary"
                      onClick={() => mutate.mutate({ id: app.id, decision: "reject", note: notes[app.id] || "" })}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
