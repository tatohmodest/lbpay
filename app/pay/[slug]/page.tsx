import type { Metadata } from "next";
import { Suspense } from "react";
import { formatXAF } from "@/lib/format";
import { findLinkBySlug, findUserById } from "@/lib/server/db";
import { SITE_OG_IMAGE } from "@/lib/site";
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
  const amount = link.amount ? ` · ${formatXAF(link.amount)}` : "";
  const title = `${link.title}${amount}`;
  const description = `Pay ${merchant} on LBPay.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE.url],
    },
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-sm text-muted">Opening checkout…</p>}>
      <PayLinkClient slug={slug} />
    </Suspense>
  );
}
