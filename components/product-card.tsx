"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { payLinkPath } from "@/lib/origin";
import { productExcerpt, productPricing, productShareText, productUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";
import { ProductPrice, SaleBadge } from "@/components/product-price";
import { ShareRow } from "@/components/share-row";
import { cn } from "@/lib/cn";

export function ProductCard({
  product,
  merchantName,
  mode = "pay",
  actions,
}: {
  product: ShopProduct;
  merchantName?: string;
  mode?: "pay" | "share" | "hero" | "preview";
  actions?: ReactNode;
}) {
  const origin = useBrowserOrigin();
  const url = product.slug ? productUrl(product.slug, origin) : "";
  const shop = merchantName?.trim();
  const excerpt = productExcerpt(product.description, mode === "pay" ? 72 : 110);
  const showDescription = mode !== "pay";
  const { onSale, percentOff, original, price } = productPricing(product.amount, product.compareAtAmount);
  const saved = onSale && original && price ? original - price : 0;
  const checkout = product.slug ? payLinkPath(product.slug) : "";

  const media = (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-emerald-50 via-teal-50/40 to-slate-100 p-5 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm text-emerald-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <p className="mt-2 text-sm font-black text-ink line-clamp-1">{product.title}</p>
        </div>
      )}
      <SaleBadge percentOff={percentOff} className="absolute left-3 top-3 z-10" />
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col">
      {media}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-1.5">
          {shop ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted truncate">{shop}</p>
          ) : null}
          <h2 className="text-[1.05rem] font-black leading-snug tracking-tight text-ink transition-colors group-hover:text-emerald-700 sm:text-lg line-clamp-2">
            {product.title}
          </h2>
          {showDescription && excerpt ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">{excerpt}</p>
          ) : null}
        </div>

        <div className="mt-3.5 space-y-1 border-t border-slate-100 pt-3">
          <ProductPrice
            amount={product.amount}
            compareAtAmount={product.compareAtAmount}
            size="md"
            badge={false}
          />
          {saved > 0 ? (
            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Save {formatXAF(saved)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),0_24px_64px_rgba(5,150,105,0.14)]">
      {mode === "pay" && checkout ? (
        <Link href={checkout} className="flex flex-1 flex-col">
          {body}
        </Link>
      ) : (
        body
      )}

      {mode === "preview" ? (
        <div className="h-2" />
      ) : mode === "hero" ? (
        actions ? <div className="px-4 pb-4 sm:px-5 sm:pb-5">{actions}</div> : <div className="h-2" />
      ) : (
        <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", mode === "pay" ? "pt-0" : "pt-2")}>
          {mode === "share" ? (
            <ShareRow
              url={url}
              text={productShareText(product.title, product.amount, url)}
              copyLabel="Copy product link"
            />
          ) : checkout ? (
            <Link
              href={checkout}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-bold text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)] transition-all hover:bg-emerald-700 hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buy now</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          ) : null}
          {actions}
        </div>
      )}
    </article>
  );
}

export function ProductGrid({
  products,
  merchantName,
  mode = "pay",
}: {
  products: ShopProduct[];
  merchantName?: string;
  mode?: "pay" | "share";
}) {
  if (!products.length) return null;
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6",
        products.length === 1
          ? "max-w-sm"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} merchantName={merchantName} mode={mode} />
      ))}
    </div>
  );
}
