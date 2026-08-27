"use client";

import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Link2,
  QrCode,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { ConsoleShell, WalletShell } from "@/components/layout/shells";
import { RoleGate } from "@/components/role-gate";
import { useMe } from "@/lib/hooks/wallet";
import { productUnlocked } from "@/lib/roles";

const items = [
  { href: "/business", label: "Overview", icon: LayoutDashboard },
  { href: "/business/payments", label: "Sales", icon: Receipt },
  { href: "/business/invoices", label: "Invoices", icon: FileText },
  { href: "/business/customers", label: "Customers", icon: Users },
  { href: "/business/links", label: "Payment Links", icon: Link2 },
  { href: "/business/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/business/settlements", label: "Settlement", icon: Wallet },
  { href: "/business/qr", label: "QR Codes", icon: QrCode },
  { href: "/business/settings", label: "Settings", icon: Settings },
];

export function BusinessLayoutClient({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const unlocked = productUnlocked(me.data?.user, "business");

  if (!me.isFetched) {
    return (
      <WalletShell>
        <p className="p-8 text-sm text-muted">Checking access…</p>
      </WalletShell>
    );
  }

  if (!unlocked) {
    return (
      <WalletShell>
        <RoleGate kind="business">{children}</RoleGate>
      </WalletShell>
    );
  }

  return (
    <ConsoleShell
      title="Business"
      subtitle="Get paid by your customers"
      items={items}
      cta={{ href: "/business/links", label: "New payment link" }}
    >
      <RoleGate kind="business">{children}</RoleGate>
    </ConsoleShell>
  );
}
