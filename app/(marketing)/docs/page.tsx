import type { Metadata } from "next";
import { DocsContent } from "@/components/docs-content";
import { Container } from "@/components/marketing/container";

export const metadata: Metadata = {
  title: "Payments API for Cameroon: sandbox, webhooks, XAF",
  description:
    "LBPay developer docs: create XAF payments, payouts, and payment links. Sandbox keys on apply, live keys after KYC. MTN Mobile Money, Orange Money, and wallet rails.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "LBPay Payments API for Cameroon",
    description:
      "Integrate collections and disbursements in XAF. Sandbox keys immediately, live keys after KYC.",
    url: "/docs",
  },
};

export default function DocsPage() {
  return (
    <Container className="py-12 md:py-16">
      <DocsContent />
    </Container>
  );
}
