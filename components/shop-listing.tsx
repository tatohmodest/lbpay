"use client";

import { canonicalizeHandlePath } from "@/lib/origin";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { ProductGrid } from "@/components/product-card";
import { ShareRow } from "@/components/share-row";
import { AppImg } from "@/components/app-img";
import { shopShareText, shopUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";
import { BadgeCheck, Lock, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { NetworkMark } from "@/components/network-mark";
import { useState } from "react";
import { mediaSrc } from "@/lib/media";

type ShopPayload = {
  found?: boolean;
  user?: { name: string; lbpayId: string; avatar?: string; businessName?: string; verified?: boolean };
  products?: ShopProduct[];
};

export function ShopListing({ handle }: { handle: string }) {
  const origin = useBrowserOrigin();
  const [query, setQuery] = useState("");
  const shop = useQuery({
    queryKey: ["shop", handle],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/lookup?q=${encodeURIComponent(handle)}`);
      const data = (await res.json()) as ShopPayload;
      if (!res.ok) throw new Error("Could not load this shop.");
      canonicalizeHandlePath(handle, data.user?.lbpayId);
      return data;
    },
    enabled: Boolean(handle),
  });

  const user = shop.data?.user;
  const products = shop.data?.products || [];
  const notFound = Boolean(handle) && (shop.isError || (shop.isFetched && !shop.data?.found));

  if (!handle || notFound) {
    return (
      <main className="min-h-screen bg-paper px-4 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" markClassName="h-8 w-8" />
          </div>
          <section className="rounded-[2rem] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-paper text-muted">
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
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <p className="text-sm font-semibold text-muted animate-pulse">Opening shop…</p>
      </main>
    );
  }

  const shopName = user.businessName || user.name;
  const url = shopUrl(user.lbpayId, origin);
  const needle = query.trim().toLowerCase();
  const shown = needle ? products.filter((p) => p.title.toLowerCase().includes(needle)) : products;
  const prices = products.map((p) => p.amount).filter((n): n is number => typeof n === "number" && n > 0);

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="relative overflow-hidden bg-forest px-4 pb-28 pt-5 text-white">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
          <Logo href="/" tone="dark" markClassName="h-8 w-8" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 ring-1 ring-white/15">
            <Lock className="h-3.5 w-3.5 text-brand" /> Secure checkout
          </span>
        </div>
      </header>

      <div className="mx-auto -mt-20 w-full max-w-5xl space-y-6 px-4">
        <section className="lb-rise relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(6,38,28,0.35)] ring-1 ring-line sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AppImg
              src={mediaSrc(user.avatar)}
              alt=""
              className="h-20 w-20 shrink-0 rounded-[1.4rem] object-cover ring-4 ring-paper"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[1.75rem] font-black leading-tight tracking-tight text-ink">{shopName}</h1>
                {user.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-deep">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified business
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 font-mono text-[13px] font-semibold text-brand-deep">@{user.lbpayId}</p>
              <p className="tabular mt-2 text-[13px] text-muted">
                {products.length} product{products.length === 1 ? "" : "s"}
                {prices.length ? ` · from ${Math.min(...prices).toLocaleString("fr-FR")} XAF` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Pay with</span>
              <div className="flex gap-1.5">
                {(["mtn", "orange", "wallet"] as const).map((n) => (
                  <NetworkMark key={n} network={n} className="h-8 w-8 rounded-lg text-[7px]" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-ink">Products</h2>
              <p className="text-[13px] text-muted">Tap a product to see it and pay in seconds.</p>
            </div>
            {products.length > 6 ? (
              <label className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand sm:w-72">
                <Search className="h-4 w-4 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this shop"
                  aria-label="Search products"
                  className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-muted"
                />
              </label>
            ) : null}
          </div>

          {shown.length ? (
            <ProductGrid products={shown} merchantName={shopName} mode="pay" />
          ) : (
            <div className="rounded-[2rem] border-2 border-dashed border-line bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-paper text-muted">
                <ShoppingBag className="h-6 w-6" />
              </span>
              <p className="mt-3 text-[15px] font-bold text-ink">
                {needle ? `Nothing matches “${query}”` : "No products here yet"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
                {needle ? "Try a different word." : "This shop hasn't listed anything yet. Check back soon."}
              </p>
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-[2rem] bg-white p-5 ring-1 ring-line sm:grid-cols-[1fr_minmax(0,320px)] sm:items-center sm:p-6">
          <div>
            <p className="text-[15px] font-bold text-ink">Love this shop? Share it.</p>
            <p className="mt-1 text-[13px] text-muted">Send it to a friend on WhatsApp, Facebook or Telegram.</p>
          </div>
          <ShareRow url={url} text={shopShareText(shopName, url)} copyLabel="Copy shop link" />
        </section>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-[12px] text-muted">
          <li className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-brand" /> You approve every payment on your phone
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Price and fee shown before you pay
          </li>
        </ul>
        <p className="pb-2 text-center text-[13px] text-muted">
          Sell online too?{" "}
          <Link href="/products/business" className="font-bold text-brand-deep hover:underline">
            Open your LBPay shop
          </Link>
        </p>
      </div>
    </main>
  );
}
