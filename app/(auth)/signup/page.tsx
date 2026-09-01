import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create a Cameroon XAF wallet",
  description:
    "Open a free LBPay wallet to send and receive XAF, transfer between MTN Mobile Money and Orange Money, and collect payments in Cameroon.",
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Create a Cameroon XAF wallet",
    description:
      "Open a free LBPay wallet to send and receive XAF, transfer between MTN Mobile Money and Orange Money, and collect payments in Cameroon.",
    url: "/signup",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [SITE_OG_IMAGE.url],
  },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="signup" invitedBy={params.ref} />;
}
