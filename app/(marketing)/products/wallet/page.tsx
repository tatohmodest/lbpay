import { ProductPage, productMetadata } from "@/components/marketing/product-page";

export const metadata = productMetadata(
  "Personal XAF wallet",
  "Send and receive XAF, transfer between MTN and Orange, and keep a PIN-protected wallet with an @handle.",
  "/products/wallet",
);

export default function WalletProductPage() {
  return (
    <ProductPage
      eyebrow="Personal"
      title="Your XAF wallet, with an @handle."
      description="Send to a number or an @handle, request money, and cash out to MTN or Orange. Wallet to wallet is instant."
      image="/illustrations/hero-send-money.png"
      alt="LBPay personal wallet for sending money in Cameroon"
      points={[
        "Deposits from MTN or Orange (card coming soon)",
        "Withdrawals to Mobile Money",
        "QR receive, payment links, and bill split",
      ]}
      cta={{ href: "/signup", label: "Create wallet" }}
      secondary={{ href: "/login", label: "Sign in" }}
    />
  );
}
