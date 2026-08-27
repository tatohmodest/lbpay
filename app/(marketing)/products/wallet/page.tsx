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
      description="Open an account, verify email, set a PIN. Then send to a number or a handle, request money, buy airtime, and pay bills. Wallet to wallet is instant. Money leaving to MTN or Orange is a disbursement."
      image="/illustrations/hero-send-money.png"
      alt="LBPay personal wallet for sending money in Cameroon"
      points={[
        "Deposits from MTN, Orange, or card",
        "Withdrawals to Mobile Money",
        "QR receive, payment links, and bill split",
      ]}
      cta={{ href: "/signup", label: "Create wallet" }}
      secondary={{ href: "/login", label: "Sign in" }}
    />
  );
}
