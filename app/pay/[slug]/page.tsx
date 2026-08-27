"use client";

import { use } from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckoutPay } from "@/components/checkout-pay";
import { Card } from "@/components/ui/card";

function PayLinkInner({ slug }: { slug: string }) {
  const link = useQuery({
    queryKey: ["pay", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pay/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      return data as {
        link: { title: string; amount: number | null };
        merchant: { name: string; lbpayId: string } | null;
      };
    },
  });

  if (link.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-black">Link not found</h1>
          <p className="mt-2 text-sm text-muted">This payment link is missing or inactive.</p>
        </Card>
      </main>
    );
  }

  if (!link.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <p className="text-sm text-muted">Opening checkout…</p>
      </main>
    );
  }

  return (
    <CheckoutPay
      slug={slug}
      handle={link.data.merchant?.lbpayId}
      title={link.data.link.title}
      merchantName={link.data.merchant?.name || "Payment request"}
      merchantHandle={link.data.merchant?.lbpayId || ""}
      fixedAmount={link.data.link.amount}
    />
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-sm text-muted">Opening checkout…</p>}>
      <PayLinkInner slug={slug} />
    </Suspense>
  );
}
