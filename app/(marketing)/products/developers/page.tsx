import { ProductPage, productMetadata } from "@/components/marketing/product-page";

export const metadata = productMetadata(
  "Payments API for Cameroon",
  "Apply from Profile. After approval, sandbox and live keys unlock in the Developer Portal. Create XAF payments, payouts, payment links, and webhooks.",
  "/products/developers",
);

export default function DevelopersProductPage() {
  return (
    <ProductPage
      eyebrow="Developers"
      title="A payments API. Not a wrapper."
      description="Apply from your account. After approval, the Developer Portal unlocks with sandbox and live keys. Integrate collections, disbursements, payment links, webhooks, and balance against LBPay, with MTN and Orange as rails."
      image="/illustrations/developer-platform.png"
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
