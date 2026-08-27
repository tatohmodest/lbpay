"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useMe } from "@/lib/hooks/wallet";
import { hasKind } from "@/lib/roles";
import { useNotify } from "@/lib/notify";
import type { AccountKind, KycTrack } from "@/lib/types";

export function RoleGate({
  kind,
  children,
}: {
  kind: AccountKind;
  children: React.ReactNode;
}) {
  const me = useMe();
  const user = me.data?.user;
  if (!me.isFetched) {
    return <p className="p-8 text-sm text-muted">Checking access…</p>;
  }
  if (hasKind(user, kind)) return <>{children}</>;
  const track: KycTrack = kind === "business" ? "business" : kind === "developer" ? "developer" : "personal";
  const state = user?.kyc?.[track];
  if (state === "pending") {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">KYC in review</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {kind === "business" ? "Business access pending" : "Live developer access pending"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {kind === "developer"
            ? "Sandbox is available as soon as you apply. Live keys wait for an admin to approve your KYC."
            : "An admin will review this application. You will get the Business console after approval."}
        </p>
      </Card>
    );
  }
  return <ApplyAccess track={track} kind={kind} />;
}

function ApplyAccess({ track, kind }: { track: KycTrack; kind: AccountKind }) {
  const notify = useNotify();
  const client = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, legalName, idNumber, businessName, taxId, website }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      notify.error("Could not apply", data.error || "Try again");
      return;
    }
    notify.success("Application sent", track === "developer" ? "Sandbox is unlocking now." : "Admin will review it.");
    await client.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <p className="text-xs font-bold uppercase tracking-wide text-brand">Role access</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {kind === "business" ? "Apply for Business" : "Apply for Developers"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {kind === "developer"
          ? "Submit KYC to test in sandbox immediately. Live keys are issued after an admin approves you."
          : "Business collections, payment links, and QR need a verified merchant profile."}
      </p>
      <Card className="mt-6 p-6">
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <Field label="Legal name">
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
          </Field>
          <Field label="National ID / passport">
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </Field>
          {kind === "business" ? (
            <>
              <Field label="Business name">
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </Field>
              <Field label="Tax ID">
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </Field>
            </>
          ) : (
            <Field label="Website / app">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </Field>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Submit KYC"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: async () => {
      const res = await fetch("/api/admin/session");
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ...data } as {
        status: number;
        admin?: boolean;
        needOtp?: boolean;
        error?: string;
      };
    },
  });
}
