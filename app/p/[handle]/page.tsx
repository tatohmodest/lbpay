"use client";

import { use } from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckoutPay } from "@/components/checkout-pay";
import { Card } from "@/components/ui/card";

export default function PayHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: raw } = use(params);
  const handle = decodeURIComponent(raw || "").replace(/^@/, "").trim().toLowerCase();
  const lookup = useQuery({
    queryKey: ["pay-handle", handle],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/lookup?q=${encodeURIComponent(handle)}`);
      const data = (await res.json()) as {
        found?: boolean;
        user?: { name: string; lbpayId: string };
      };
      if (!res.ok) throw new Error("Could not load this account.");
      return data;
    },
    enabled: Boolean(handle),
  });

  if (!handle || lookup.isError || (lookup.isFetched && !lookup.data?.found)) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-black">Account not found</h1>
          <p className="mt-2 text-sm text-muted">This QR is not linked to an LBPay wallet.</p>
        </Card>
      </main>
    );
  }

  if (!lookup.data?.user) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <p className="text-sm text-muted">Opening checkout…</p>
      </main>
    );
  }

  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-sm text-muted">Opening checkout…</p>}>
      <CheckoutPay
        handle={lookup.data.user.lbpayId}
        title={`Pay ${lookup.data.user.name}`}
        merchantName={lookup.data.user.name}
        merchantHandle={lookup.data.user.lbpayId}
      />
    </Suspense>
  );
}
