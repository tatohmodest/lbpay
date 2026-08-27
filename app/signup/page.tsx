import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create a Cameroon XAF wallet",
  description:
    "Open a free LBPay wallet to send and receive XAF, transfer between MTN Mobile Money and Orange Money, and collect payments in Cameroon.",
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
