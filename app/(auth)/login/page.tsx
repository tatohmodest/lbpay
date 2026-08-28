import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in to your XAF wallet",
  description:
    "Sign in to LBPay to send money in Cameroon, manage your XAF wallet, and access business or developer tools.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sign in to your XAF wallet",
    description:
      "Sign in to LBPay to send money in Cameroon, manage your XAF wallet, and access business or developer tools.",
    url: "/login",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [SITE_OG_IMAGE.url],
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      notice={
        params.reset === "1" ? "Password updated. Sign in with your new password." : undefined
      }
    />
  );
}
