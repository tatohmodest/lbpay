"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
  const { onSale, percentOff, original, price } = productPricing(product.amount, product.compareAtAmount);
  const saved = onSale && original && price ? original - price : 0;
  const checkout = product.slug ? payLinkPath(product.slug) : "";

  const media = (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-brand-soft to-paper sm:aspect-[5/4]">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center px-4 text-center">
          <p className="text-xl font-black text-brand-deep">{product.title}</p>
        </div>
      )}
      <SaleBadge percentOff={percentOff} className="absolute left-3 top-3" />
    </div>
  );

  const body = (
    <>
      {media}
      <div className="space-y-1.5 px-4 pb-2 pt-4 sm:px-5">
        {shop ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{shop}</p>
        ) : null}
        <h2 className="text-[1.05rem] font-black leading-tight tracking-tight text-ink sm:text-lg">
          {product.title}
        </h2>
        {excerpt ? <p className="line-clamp-2 text-sm leading-5 text-muted">{excerpt}</p> : null}
        <ProductPrice
          amount={product.amount}
          compareAtAmount={product.compareAtAmount}
          size="md"
          badge={false}
        />
        {saved > 0 ? (
          <p className="text-xs font-semibold text-brand-deep">Save {formatXAF(saved)}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_32px_rgba(12,25,19,0.06)] ring-1 ring-line/80">
      {mode === "pay" && checkout ? (
        <Link href={checkout} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      {mode === "preview" ? (
        <div className="h-3" />
      ) : mode === "hero" ? (
        actions ? <div className="px-4 pb-4 sm:px-5 sm:pb-5">{actions}</div> : <div className="h-3" />
      ) : (
        <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", mode === "pay" ? "pt-2" : "pt-3")}>
          {mode === "share" ? (
            <ShareRow url={url} text={productShareText(product.title, product.amount, url)} copyLabel="Copy product link" />
          ) : checkout ? (
            <Link
              href={checkout}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,179,105,0.28)] hover:bg-brand-dark"
            >
              Buy now
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} merchantName={merchantName} mode={mode} />
      ))}
    </div>
  );
}
