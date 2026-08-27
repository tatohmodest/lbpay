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
              ? "We are still looking this over. Business tools open after that."
              : "A verified account is all you need to start collecting as a business."}
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
            Thanks. We are reviewing your application and will be in touch shortly.
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
          {kind === "business" ? "Start collecting as a business" : "Add payments to your product"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {kind === "developer"
            ? "Accept payments in your app or website with MTN, Orange, cards, and wallet."
            : "Get paid by your customers with MTN, Orange, cards, and wallet."}
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
            subtitle={
              kind === "developer"
                ? "Tell us about your product so we can open developer tools."
                : "A few details so customers can pay you with confidence."
            }
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
