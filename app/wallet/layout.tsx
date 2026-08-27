import { NOINDEX } from "@/lib/site";
import { WalletShell } from "@/components/layout/shells";

export const metadata = NOINDEX;

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletShell>{children}</WalletShell>;
}
