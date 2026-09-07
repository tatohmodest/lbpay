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
  const url = shopUrl(user.lbpayId, origin);

  if (!products.length) {
    return (
      <CheckoutPay
        handle={user.lbpayId}
        title={`Pay ${user.name}`}
        merchantName={shopName}
        merchantHandle={user.lbpayId}
        merchantAvatar={user.avatar}
      />
    );
  }

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="bg-forest px-4 pb-20 pt-6 text-white">
        <div className="mx-auto flex w-full max-w-5xl justify-center">
          <Logo href="/" tone="dark" markClassName="h-8 w-8" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <section className="-mt-14 overflow-hidden rounded-[1.85rem] bg-white shadow-[0_18px_50px_rgba(6,38,28,0.12)] ring-1 ring-line/80">
          <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
            <AppImg
              src={user.avatar}
              alt=""
              className="h-[4.75rem] w-[4.75rem] rounded-full object-cover ring-4 ring-brand-soft"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Shop</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">{shopName}</h1>
              <p className="mt-1 font-mono text-sm font-bold text-brand">@{user.lbpayId}</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {products.length} {products.length === 1 ? "product" : "products"} · Pay with MTN, Orange, or
                wallet
              </p>
            </div>
          </div>
          <div className="border-t border-line/80 px-5 py-4 sm:px-7">
            <ShareRow url={url} text={shopShareText(shopName, url)} copyLabel="Share this shop" />
          </div>
        </section>

        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight">Products</h2>
              <p className="text-sm text-muted">Tap a product to see details and pay.</p>
            </div>
          </div>
          <ProductGrid products={products} merchantName={shopName} mode="pay" />
        </div>

        <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80 sm:p-6">
          <CheckoutPay
            variant="embedded"
            handle={user.lbpayId}
            title={`Pay ${shopName}`}
            merchantName={shopName}
            merchantHandle={user.lbpayId}
            merchantAvatar={user.avatar}
          />
        </section>
        <p className="pb-2 text-center text-xs text-muted">
          Want this for your own goods?{" "}
          <Link href="/signup" className="font-bold text-brand-deep hover:underline">
            Create a shop
          </Link>
        </p>
      </div>
    </main>
  );
}
