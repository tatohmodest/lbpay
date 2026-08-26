import { WalletShell } from "@/components/layout/shells";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletShell>{children}</WalletShell>;
}
