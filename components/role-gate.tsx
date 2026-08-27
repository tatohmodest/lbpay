"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KycApplyForm } from "@/components/kyc-apply-form";
import { useMe } from "@/lib/hooks/wallet";
import { hasKind, isAdmin } from "@/lib/roles";
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

  const track: KycTrack = kind === "business" ? "business" : kind === "developer" ? "developer" : "personal";
  const state = user?.kyc?.[track];
  const personal = user?.kyc?.personal;

  if (isAdmin(user)) return <>{children}</>;

  if (kind === "business" && personal !== "verified") {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your account first</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {personal === "pending"
            ? "We're still reviewing your account. Business benefits unlock after that."
            : "Verify your account to unlock business benefits."}
        </p>
        <Link href="/wallet/kyc" className="mt-6 inline-block">
          <Button>{personal === "pending" ? "See status" : "Verify account"}</Button>
        </Link>
      </Card>
    );
  }

  if (hasKind(user, kind) && state !== "rejected") {
    return <>{children}</>;
  }

  if (state === "pending") {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">KYC in review</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {kind === "business" ? "Business access pending" : "Live developer access pending"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {kind === "developer"
            ? "Sandbox is ready. Live keys wait until your account is approved."
            : "You'll get the Business console after this is approved."}
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <p className="text-xs font-bold uppercase tracking-wide text-brand">Role access</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {kind === "business" ? "Apply for Business" : "Apply for Developers"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {kind === "developer"
          ? "Confirm your account to get sandbox access. Live keys after we review."
          : "Add your business details so we can open the merchant tools."}
      </p>
      <div className="mt-6">
        <KycApplyForm
          track={track}
          title={kind === "business" ? "Business profile" : "Developer account"}
          subtitle={
            kind === "developer"
              ? "Photos are compressed. 10MB max."
              : "Collections, payment links, and QR for your shop."
          }
        />
      </div>
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
