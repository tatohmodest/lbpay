"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KycApplyForm } from "@/components/kyc-apply-form";
import { useMe } from "@/lib/hooks/wallet";
import { isAdmin, productUnlocked } from "@/lib/roles";
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

  if (kind === "business" || kind === "developer") {
    if (productUnlocked(user, kind)) return <>{children}</>;

    if (kind === "business" && personal !== "verified") {
      return (
        <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Verify your account first</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {personal === "pending"
              ? "We are still reviewing your account. Business benefits unlock after that."
              : "Verify your account to unlock business benefits."}
          </p>
          <Link href="/wallet/kyc" className="mt-6 inline-block">
            <Button>{personal === "pending" ? "See status" : "Verify account"}</Button>
          </Link>
        </Card>
      );
    }

    if (state === "pending") {
      return (
        <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {kind === "business" ? "Business application received" : "Developer application received"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {kind === "developer"
              ? "The developer portal unlocks after approval."
              : "The business console unlocks after approval."}
          </p>
          <Link href="/wallet" className="mt-6 inline-block">
            <Button variant="secondary">Back to wallet</Button>
          </Link>
        </Card>
      );
    }

    return (
      <div className="mx-auto max-w-lg py-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {kind === "business" ? "Open a business account" : "Become a developer"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {kind === "developer"
            ? "Apply to use the payments API. Developer tools unlock on this page after approval."
            : "Add your business details so we can open merchant tools."}
        </p>
        {kind === "developer" ? (
          <Link href="/docs" className="mt-3 inline-block text-sm font-bold text-brand">
            Learn about APIs
          </Link>
        ) : null}
        <div className="mt-6">
          <KycApplyForm
            track={track}
            title={kind === "business" ? "Business profile" : "Developer application"}
            subtitle={kind === "developer" ? "Photos are compressed. 10MB max." : "Collections, payment links, and QR for your shop."}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
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
