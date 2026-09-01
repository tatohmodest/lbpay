import { ProductPage, productMetadata } from "@/components/marketing/product-page";

export const metadata = productMetadata(
  "Payments API for Cameroon",
  "A payments API for Cameroon. Collect, pay out, and get webhooks in your own product.",
  "/products/developers",
);

export default function DevelopersProductPage() {
  return (
    <ProductPage
      eyebrow="Developers"
      title="A payments API. Not a wrapper."
      description="Collect, pay out, and get events in your own product. Sandbox for tests. Live when you are ready. MTN and Orange stay underneath."
      image="/illustrations/developer-platform.webp"
      alt="LBPay developer platform for XAF payments and payouts"
      points={[
        "Bearer secret keys, sandbox and live",
        "Payments, payouts, links, and webhooks",
        "Test amounts that succeed, fail, or stay pending",
      ]}
      cta={{ href: "/signup", label: "Become a developer" }}
      secondary={{ href: "/docs", label: "API reference" }}
    />
  );
}
