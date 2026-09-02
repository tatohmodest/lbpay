"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckoutPay } from "@/components/checkout-pay";
import { Logo } from "@/components/logo";

export function PayLinkClient({ slug }: { slug: string }) {
  const link = useQuery({
    queryKey: ["pay", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pay/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      return data as {
        link: {
          title: string;
          amount: number | null;
          imageUrl?: string;
          template?: string;
        };
        merchant: { name: string; lbpayId: string } | null;
      };
    },
  });

  if (link.isError) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" markClassName="h-8 w-8" />
          </div>
          <section className="rounded-[1.25rem] border border-line/80 bg-white p-8 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
            <h1 className="text-xl font-black">Link not found</h1>
            <p className="mt-2 text-sm text-muted">This payment link is missing or inactive.</p>
          </section>
        </div>
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
      imageUrl={link.data.link.imageUrl}
      template={link.data.link.template}
    />
  );
}
