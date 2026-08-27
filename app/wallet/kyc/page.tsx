"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KycApplyForm } from "@/components/kyc-apply-form";
import { useMe } from "@/lib/hooks/wallet";

export default function PersonalKycPage() {
  const me = useMe();
  const personal = me.data?.user?.kyc?.personal || "unverified";

  if (!me.isFetched) {
    return <p className="p-8 text-sm text-muted">Opening verification…</p>;
  }

  if (personal === "pending") {
    return (
      <Card className="mx-auto mt-6 max-w-lg p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">KYC in review</p>
        <h1 className="mt-2 text-2xl font-black">Personal verification pending</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          We have your ID photos. An admin will review the front, back, and the photo of you holding
          the document.
        </p>
        <Link href="/wallet" className="mt-6 inline-block">
          <Button variant="secondary">Back to wallet</Button>
        </Link>
      </Card>
    );
  }

  if (personal === "verified") {
    return (
      <Card className="mx-auto mt-6 max-w-lg p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Verified</p>
        <h1 className="mt-2 text-2xl font-black">Your identity is verified</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          You can now apply for Business. Developer access still needs its own ID photos for live
          keys.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href="/business">
            <Button className="w-full">Apply for Business</Button>
          </Link>
          <Link href="/wallet/profile">
            <Button variant="secondary" className="w-full">
              Back to profile
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-brand">Personal verification</p>
      <h1 className="mt-2 text-3xl font-black">Verify your identity</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {personal === "rejected"
          ? "The last review was not approved. Upload clear photos of your national ID or passport and try again."
          : "Everyone starts here. Business verification stays locked until this is approved."}
      </p>
      <div className="mt-6">
        <KycApplyForm
          track="personal"
          title="Identity documents"
          subtitle="Front, back, and a photo of you holding the same ID or passport. Files are compressed. Maximum 10MB each."
        />
      </div>
    </div>
  );
}
