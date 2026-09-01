import type { Metadata } from "next";
import { DocsContent } from "@/components/docs-content";
import { DocsOnThisPage, DocsSidebar } from "@/components/docs/docs-sidebar";
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
    <div className="bg-paper">
      <div className="relative overflow-hidden bg-forest text-white">
        <Container className="py-12 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Developers
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
            Build payments into your product.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-white/65">
            Guides and reference for the LBPay API — collections, payouts, payment links, and
            sandbox behavior in XAF.
          </p>
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-[220px_minmax(0,1fr)_200px] lg:gap-12 lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1.25rem)]">
            <DocsSidebar />
          </div>
        </aside>
        <div className="min-w-0">
          <details className="mb-8 rounded-xl border border-line bg-white p-3 lg:hidden">
            <summary className="cursor-pointer px-2 py-1.5 text-sm font-semibold text-ink">
              On this page
            </summary>
            <div className="mt-3">
              <DocsSidebar />
            </div>
          </details>
          <DocsContent hideHeader />
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-[calc(var(--header-h)+1.25rem)]">
            <DocsOnThisPage />
          </div>
        </aside>
      </Container>
    </div>
  );
}
