import type { Metadata } from "next";
import { Suspense } from "react";
import { formatXAF } from "@/lib/format";
import { findLinkBySlug, findUserById } from "@/lib/server/db";
import { productExcerpt, productPricing } from "@/lib/shop";
import { isSafeProductImageUrl } from "@/lib/product-image";
import { shareImage, shareMetadata, shareOrigin } from "@/lib/server/share-meta";
import { PayLinkClient } from "./pay-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await findLinkBySlug(slug);
  if (!link) {
    return { title: "Payment", robots: { index: false, follow: false } };
  }
  const owner = await findUserById(link.userId);
  const merchant = owner?.businessName || owner?.name || "LBPay";
  const { price, original, onSale } = productPricing(link.amount, link.compareAtAmount);
  const priceText = price ? ` · ${formatXAF(price)}` : "";
  const sale = onSale && original ? ` (was ${formatXAF(original)})` : "";
  const excerpt = productExcerpt(link.description, 120);
  const origin = await shareOrigin();
  return shareMetadata({
    title: `${link.title}${priceText}`,
    description: `${excerpt ? `${excerpt} ` : ""}${merchant} on LBPay${sale}. Pay safely with MTN MoMo, Orange Money or your LBPay wallet.`,
    path: `/pay/${encodeURIComponent(link.slug)}`,
    origin,
    image: isSafeProductImageUrl(link.imageUrl || "") ? shareImage(link.imageUrl, origin, {
      alt: link.title,
      shape: "wide",
      fallbackRoute: `/api/share-image/product/${encodeURIComponent(link.slug)}`,
    }) : null,
  });
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-sm text-muted">Opening checkout…</p>}>
      <PayLinkClient slug={slug} />
    </Suspense>
  );
}
