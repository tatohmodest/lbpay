import { NOINDEX } from "@/lib/site";

export const metadata = {
  ...NOINDEX,
  title: "Reset your password",
  description: "Reset your LBPay password with a one-time code sent to your email.",
};

export default function ForgotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
