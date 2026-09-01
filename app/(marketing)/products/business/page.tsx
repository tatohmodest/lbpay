import { ProductPage, productMetadata } from "@/components/marketing/product-page";

export const metadata = productMetadata(
  "Business checkout for Cameroon",
  "Collect MTN, Orange, and wallet through one QR and payment-link checkout. (Cards coming soon)",
  "/products/business",
);

export default function BusinessProductPage() {
  return (
    <ProductPage
      eyebrow="Business"
      title="One counter for every way Cameroon pays."
      description="QR codes, payment links, and one checkout. Customers pay with MTN, Orange, or wallet. Cards coming soon. You get paid in one place."
      image="/illustrations/merchant-qr.webp"
      alt="LBPay merchant QR checkout in Cameroon"
      points={[
        "MTN, Orange, cards, and LBPay wallet",
        "Payment links you can share anywhere",
        "Settlements on the same XAF ledger",
      ]}
      cta={{ href: "/signup", label: "Apply as a business" }}
      secondary={{ href: "/docs", label: "Read the docs" }}
    />
  );
}
