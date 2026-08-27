import type { Metadata } from "next";
import { DocsContent } from "@/components/docs-content";

export const metadata: Metadata = {
  title: "Payments API for Cameroon — sandbox, webhooks, XAF",
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
    <div className="min-h-screen bg-white px-4 py-10 md:px-8">
      <DocsContent publicHeader />
    </div>
  );
}
