"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatXAF } from "@/lib/format";
import { payLinkPath } from "@/lib/origin";
import { productShareText, productUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";
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
  mode?: "pay" | "share" | "hero";
  actions?: ReactNode;
}) {
  const origin = useBrowserOrigin();
  const url = productUrl(product.slug, origin);
  const price = product.amount && product.amount > 0 ? formatXAF(product.amount) : "Open amount";
  const shop = merchantName?.trim();

  const body = (
    <>
      <div className="aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-brand-soft to-paper">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center">
            <p className="text-xl font-black text-brand-deep">{product.title}</p>
          </div>
        )}
      </div>
      <div className="space-y-1 px-5 pb-2 pt-4">
        {shop ? <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{shop}</p> : null}
        <h2 className="text-lg font-black leading-tight tracking-tight text-ink">{product.title}</h2>
        <p className="font-mono text-[1.65rem] font-black text-brand">{price}</p>
      </div>
    </>
  );

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80 shadow-[0_12px_32px_rgba(12,25,19,0.06)]">
      {mode === "pay" ? (
        <Link href={payLinkPath(product.slug)} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      {mode === "hero" ? (
        <div className="h-2" />
      ) : (
        <div className={cn("px-5 pb-5", mode === "pay" ? "pt-2" : "pt-3")}>
          {mode === "share" ? (
            <ShareRow url={url} text={productShareText(product.title, product.amount, url)} copyLabel="Copy product link" />
          ) : (
            <Link
              href={payLinkPath(product.slug)}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,179,105,0.28)] hover:bg-brand-dark"
            >
              Pay now
            </Link>
          )}
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
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} merchantName={merchantName} mode={mode} />
      ))}
    </div>
  );
}
