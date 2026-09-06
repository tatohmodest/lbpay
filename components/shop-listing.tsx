"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckoutPay } from "@/components/checkout-pay";
import { Logo } from "@/components/logo";
import { ProductGrid } from "@/components/product-card";
import { ShareRow } from "@/components/share-row";
import { AppImg } from "@/components/app-img";
import { shopShareText, shopUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";

type ShopPayload = {
  found?: boolean;
  user?: { name: string; lbpayId: string; avatar?: string; businessName?: string };
  products?: ShopProduct[];
};

export function ShopListing({ handle }: { handle: string }) {
  const origin = useBrowserOrigin();
  const shop = useQuery({
    queryKey: ["shop", handle],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/lookup?q=${encodeURIComponent(handle)}`);
      const data = (await res.json()) as ShopPayload;
      if (!res.ok) throw new Error("Could not load this shop.");
      return data;
    },
    enabled: Boolean(handle),
  });

  const user = shop.data?.user;
  const products = shop.data?.products || [];
  const notFound = Boolean(handle) && (shop.isError || (shop.isFetched && !shop.data?.found));

  if (!handle || notFound) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" markClassName="h-8 w-8" />
          </div>
          <section className="rounded-[1.75rem] bg-white p-8 ring-1 ring-line/80">
            <h1 className="text-xl font-black">Shop not found</h1>
            <p className="mt-2 text-sm text-muted">This link is not linked to an LBPay shop.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <p className="text-sm text-muted">Opening shop…</p>
      </main>
    );
  }

  const shopName = user.businessName || user.name;

  if (!products.length) {
    return (
      <CheckoutPay
        handle={user.lbpayId}
        title={`Pay ${user.name}`}
        merchantName={shopName}
        merchantHandle={user.lbpayId}
      />
    );
  }

  const url = shopUrl(user.lbpayId, origin);

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex justify-center">
          <Logo href="/" markClassName="h-8 w-8" />
        </div>
        <section className="rounded-[1.75rem] bg-white p-5 text-center ring-1 ring-line/80 sm:p-6">
          <AppImg src={user.avatar} alt="" className="mx-auto h-16 w-16 rounded-full object-cover ring-4 ring-brand-soft" />
          <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">{shopName}</h1>
          <p className="mt-1 font-mono text-sm font-bold text-brand">@{user.lbpayId}</p>
          <p className="mt-2 text-sm text-muted">Pick a product and pay with MTN, Orange, or wallet.</p>
          <div className="mt-5 text-left">
            <ShareRow url={url} text={shopShareText(shopName, url)} copyLabel="Copy shop link" />
          </div>
        </section>
        <ProductGrid products={products} merchantName={shopName} mode="pay" />
        <CheckoutPay
          variant="embedded"
          handle={user.lbpayId}
          title={`Pay ${shopName}`}
          merchantName={shopName}
          merchantHandle={user.lbpayId}
        />
        <p className="pb-6 text-center text-xs text-muted">
          Want this for your own goods?{" "}
          <Link href="/signup" className="font-bold text-brand-deep hover:underline">
            Create a shop
          </Link>
        </p>
      </div>
    </main>
  );
}
