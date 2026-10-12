"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { payLinkPath } from "@/lib/origin";
import { productExcerpt, productPricing, productShareText, productUrl, type ShopProduct } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";
import { SaleBadge } from "@/components/product-price";
import { ShareRow } from "@/components/share-row";
import { cn } from "@/lib/cn";

/**
 * One product, shop-shelf style: a white card with an inset photo, the name,
 * and price + Buy on one line. Same card on the public shop, product pages,
 * and the merchant dashboard so sellers see exactly what customers see.
 */
export function ProductCard({
  product,
  merchantName,
  mode = "pay",
  actions,
}: {
  product: ShopProduct;
  merchantName?: string;
  /** pay: public, opens checkout · share: with share buttons · hero: dashboard with actions · preview: form preview */
  mode?: "pay" | "share" | "hero" | "preview";
  actions?: ReactNode;
}) {
  const origin = useBrowserOrigin();
  const url = product.slug ? productUrl(product.slug, origin) : "";
  const shop = merchantName?.trim();
  const excerpt = productExcerpt(product.description, 90);
  const { onSale, percentOff, original, price } = productPricing(product.amount, product.compareAtAmount);
  const checkout = product.slug ? payLinkPath(product.slug) : "";
  const linked = mode === "pay" && Boolean(checkout);

  const media = (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-paper">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-[radial-gradient(80%_80%_at_50%_30%,var(--color-brand-soft),var(--color-paper))]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-deep shadow-sm ring-1 ring-line">
            <ShoppingBag className="h-5 w-5" />
          </span>
        </div>
      )}
      <SaleBadge percentOff={percentOff} className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px]" />
    </div>
  );

  const priceRow = (
    <div className="mt-1.5 flex items-end justify-between gap-2">
      <div className="min-w-0 leading-tight">
        {price ? (
          <p className="tabular truncate text-[14px] font-bold text-ink sm:text-[15px]">{formatXAF(price)}</p>
        ) : (
          <p className="truncate text-[13px] font-bold text-brand-deep">Any amount</p>
        )}
        {onSale && original ? (
          <p className="tabular truncate text-[11px] font-medium text-muted line-through">{formatXAF(original)}</p>
        ) : null}
      </div>
      {mode === "pay" || mode === "preview" ? (
        <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(0,179,105,0.8)] transition group-hover:bg-brand-dark">
          Buy
        </span>
      ) : mode === "hero" ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Live
        </span>
      ) : null}
    </div>
  );

  const body = (
    <>
      {media}
      <div className="px-0.5 pt-2.5">
        {shop && mode !== "hero" ? (
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-brand-deep">{shop}</p>
        ) : null}
        <h2 className="truncate text-[13px] font-semibold text-ink sm:text-[14px]">{product.title}</h2>
        {mode === "share" && excerpt ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{excerpt}</p>
        ) : null}
        {priceRow}
      </div>
    </>
  );

  return (
    <article className="group flex flex-col rounded-2xl bg-white p-2.5 ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(6,38,28,0.35)] hover:ring-brand/30 sm:p-3">
      {linked ? (
        <Link href={checkout} className="flex flex-col focus-visible:outline-none" aria-label={`Buy ${product.title}`}>
          {body}
        </Link>
      ) : (
        <div className="flex flex-col">{body}</div>
      )}
      {mode === "share" ? (
        <div className="mt-3">
          <ShareRow url={url} text={productShareText(product.title, product.amount, url)} copyLabel="Copy link" />
        </div>
      ) : null}
      {actions ? <div className="mt-2.5">{actions}</div> : null}
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
        "grid gap-3 sm:gap-4",
        products.length === 1 ? "max-w-[260px]" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} merchantName={merchantName} mode={mode} />
      ))}
    </div>
  );
}
