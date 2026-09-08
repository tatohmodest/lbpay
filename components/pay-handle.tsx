"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckoutPay } from "@/components/checkout-pay";
import { Logo } from "@/components/logo";

type HandlePayload = {
  found?: boolean;
  user?: { name: string; lbpayId: string; avatar?: string; businessName?: string };
};

export function PayHandle({ handle }: { handle: string }) {
  const pay = useQuery({
    queryKey: ["pay-handle", handle],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/lookup?q=${encodeURIComponent(handle)}`);
      const data = (await res.json()) as HandlePayload;
      if (!res.ok) throw new Error("Could not load this account.");
      return data;
    },
    enabled: Boolean(handle),
  });

  const user = pay.data?.user;
  const notFound = Boolean(handle) && (pay.isError || (pay.isFetched && !pay.data?.found));

  if (!handle || notFound) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" markClassName="h-8 w-8" />
          </div>
          <section className="rounded-[1.75rem] bg-white p-8 ring-1 ring-line/80">
            <h1 className="text-xl font-black">Account not found</h1>
            <p className="mt-2 text-sm text-muted">This pay link is not linked to an LBPay account.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <p className="text-sm text-muted">Opening payment…</p>
      </main>
    );
  }

  return (
    <CheckoutPay
      handle={user.lbpayId}
      title={`Pay ${user.name}`}
      merchantName={user.name}
      merchantHandle={user.lbpayId}
      merchantAvatar={user.avatar}
    />
  );
}
