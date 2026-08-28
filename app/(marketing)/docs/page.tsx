import type { Metadata } from "next";
import { DocsContent } from "@/components/docs-content";
import { Container } from "@/components/marketing/container";
import { SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payments API for Cameroon: sandbox, webhooks, XAF",
  description:
    "LBPay developer docs: create XAF payments, payouts, and payment links. Apply from Profile; keys unlock after approval. MTN Mobile Money, Orange Money, and wallet rails.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "LBPay Payments API for Cameroon",
    description:
      "Integrate collections and disbursements in XAF. Apply from Profile; sandbox and live keys unlock after approval.",
    url: "/docs",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "LBPay Payments API for Cameroon",
    images: [SITE_OG_IMAGE.url],
  },
};

export default function DocsPage() {
  return (
    <Container className="py-12 md:py-16">
      <DocsContent />
    </Container>
  );
}
