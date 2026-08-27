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
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Personal KYC required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Verify yourself first</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {personal === "pending"
            ? "Your personal identity review is still in progress. Business verification unlocks after it is approved."
            : "You cannot start Business verification until personal identity is approved. Send the front, back, and a photo of you holding your ID or passport."}
        </p>
        <Link href="/wallet/kyc" className="mt-6 inline-block">
          <Button>{personal === "pending" ? "View personal KYC" : "Verify identity"}</Button>
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
            ? "Sandbox is available as soon as you apply. Live keys wait for an admin to check your ID photos."
            : "An admin will review this application. You will get the Business console after approval."}
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
          ? "Send the front and back of your national ID or passport, plus a photo of you holding it. Sandbox unlocks on submit. Live keys wait for an admin."
          : "Your personal identity is verified. Add the merchant details so an admin can open Business."}
      </p>
      <div className="mt-6">
        <KycApplyForm
          track={track}
          title={kind === "business" ? "Business profile" : "Developer identity"}
          subtitle={
            kind === "developer"
              ? "Photos are compressed on upload. Maximum 10MB each."
              : "Business collections, payment links, and QR need a verified merchant profile."
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
