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
        <h1 className="text-2xl font-black">We are reviewing your account</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Thanks. We will be in touch as soon as this is done.
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
        <h1 className="text-2xl font-black">You are verified</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your account is verified. Business tools are one step away.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href="/business">
            <Button className="w-full">Open Business</Button>
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
      <h1 className="text-3xl font-black">Verify your account</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {personal === "rejected"
          ? "We could not verify last time. You can try again whenever you are ready."
          : "A few details so we can keep your account safe."}
      </p>
      <div className="mt-6">
        <KycApplyForm
          track="personal"
          title="Your details"
          subtitle="We will use this to confirm it is really you."
        />
      </div>
    </div>
  );
}
