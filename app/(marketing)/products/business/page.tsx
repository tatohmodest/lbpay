import { ProductPage, productMetadata } from "@/components/marketing/product-page";

export const metadata = productMetadata(
  "Business checkout for Cameroon",
  "Create product links, share a shop page, and get paid with MTN, Orange, or wallet. (Cards coming soon)",
  "/products/business",
);

export default function BusinessProductPage() {
  return (
    <ProductPage
      eyebrow="Business"
      title="Run your business with LBPay."
      description="Create product links and share them with your customers. Share the whole shop or just one product. They pay with MTN, Orange, or wallet. You get paid in one place."
      image="/illustrations/business-banner.webp"
      alt="Run your business with LBPay. Create product links and share them with customers to get paid."
      points={[
        "Product links you can share on WhatsApp",
        "A shop page for the whole catalogue, or one product at a time",
        "MTN, Orange, and LBPay wallet in one checkout",
      ]}
      cta={{ href: "/signup", label: "Start selling" }}
      secondary={{ href: "/docs", label: "Read the docs" }}
    />
  );
}
