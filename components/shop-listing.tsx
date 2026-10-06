"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { ProductGrid } from "@/components/product-card";
import { ShareRow } from "@/components/share-row";
import { AppImg } from "@/components/app-img";
import { shopShareText, shopUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";
import { CheckCircle2, ShoppingBag } from "lucide-react";

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
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" markClassName="h-8 w-8" />
          </div>
          <section className="rounded-[2rem] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-muted">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black text-ink">Shop not found</h1>
            <p className="mt-2 text-sm text-muted">This link is not associated with an active LBPay shop.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <p className="text-sm font-semibold text-muted animate-pulse">Opening shop…</p>
      </main>
    );
  }

  const shopName = user.businessName || user.name;
  const url = shopUrl(user.lbpayId, origin);

  return (
    <main className="min-h-screen bg-slate-50/70 pb-20">
      {/* Brand Header Banner */}
      <header className="bg-linear-to-b from-forest to-[#072d21] px-4 pb-24 pt-8 text-white">
        <div className="mx-auto flex w-full max-w-5xl justify-center">
          <Logo href="/" tone="dark" markClassName="h-9 w-9" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
        {/* Merchant Profile Card */}
        <section className="-mt-16 overflow-hidden rounded-[2.25rem] bg-white shadow-[0_20px_60px_rgba(6,38,28,0.09)]">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
            <AppImg
              src={user.avatar}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-brand-soft shadow-md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">Storefront</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold text-brand-dark">
                  <CheckCircle2 className="h-3 w-3" /> Verified Merchant
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">{shopName}</h1>
              <p className="mt-1 font-mono text-sm font-bold text-brand">@{user.lbpayId}</p>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
                {products.length} {products.length === 1 ? "product" : "products"} listed · Seamless checkout with MTN,
                Orange, or Wallet
              </p>
            </div>
          </div>
          <div className="bg-slate-50/80 px-6 py-4 sm:px-8">
            <ShareRow url={url} text={shopShareText(shopName, url)} copyLabel="Share storefront" />
          </div>
        </section>

        {/* Product Catalogue */}
        <div>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-ink">Products</h2>
              <p className="text-xs sm:text-sm text-muted">Select an item to view options and checkout securely.</p>
            </div>
          </div>

          {products.length ? (
            <ProductGrid products={products} merchantName={shopName} mode="pay" />
          ) : (
            <section className="rounded-[2rem] bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-muted">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="text-base font-bold text-ink">No products listed yet</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                This store has not published any items for purchase yet. Check back soon!
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <p className="pb-4 text-center text-xs text-muted">
          Want this for your own business?{" "}
          <Link href="/signup" className="font-black text-brand hover:underline">
            Create an LBPay shop
          </Link>
        </p>
      </div>
    </main>
  );
}
