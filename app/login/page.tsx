import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in to your XAF wallet",
  description:
    "Sign in to LBPay to send money in Cameroon, manage your XAF wallet, and access business or developer tools.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
