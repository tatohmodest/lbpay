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
    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100/80">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-brand-soft/40 via-white to-slate-100 p-5 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-xs text-brand">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <p className="mt-2 text-sm font-black text-ink line-clamp-1">{product.title}</p>
        </div>
      )}
      <SaleBadge percentOff={percentOff} className="absolute left-3.5 top-3.5 z-10" />
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col">
      {media}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-1.5">
          {shop ? (
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand truncate">{shop}</p>
          ) : null}
          <h2 className="text-[1.05rem] font-black leading-snug tracking-tight text-ink transition-colors group-hover:text-brand sm:text-lg line-clamp-2">
            {product.title}
          </h2>
          {showDescription && excerpt ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">{excerpt}</p>
          ) : null}
        </div>

        <div className="mt-4 space-y-1.5">
          <ProductPrice
            amount={product.amount}
            compareAtAmount={product.compareAtAmount}
            size="md"
            badge={false}
          />
          {saved > 0 ? (
            <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold text-brand-dark">
              Save {formatXAF(saved)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white shadow-[0_6px_28px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,179,105,0.12),0_4px_12px_rgba(0,0,0,0.04)]">
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
        actions ? <div className="px-5 pb-5">{actions}</div> : <div className="h-2" />
      ) : (
        <div className={cn("px-5 pb-5", mode === "pay" ? "pt-0" : "pt-2")}>
          {mode === "share" ? (
            <ShareRow
              url={url}
              text={productShareText(product.title, product.amount, url)}
              copyLabel="Copy product link"
            />
          ) : checkout ? (
            <Link
              href={checkout}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,179,105,0.25)] transition-all hover:bg-brand-dark hover:shadow-[0_12px_28px_rgba(0,179,105,0.35)] active:scale-98"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buy now</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-80" />
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
