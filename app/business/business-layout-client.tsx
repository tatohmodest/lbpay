"use client";

import {
  LayoutDashboard,
  Link2,
  QrCode,
  Receipt,
  Wallet,
} from "lucide-react";
import { ConsoleShell } from "@/components/layout/shells";
import { RoleGate } from "@/components/role-gate";

const items = [
  { href: "/business", label: "Dashboard", icon: LayoutDashboard },
  { href: "/business/payments", label: "Payments", icon: Receipt },
  { href: "/business/settlements", label: "Settlements", icon: Wallet },
  { href: "/business/links", label: "Payment Links", icon: Link2 },
  { href: "/business/qr", label: "QR Codes", icon: QrCode },
];

export function BusinessLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      title="Business Console"
      subtitle="Merchant tools"
      items={items}
      cta={{ href: "/business/links", label: "New payment link" }}
    >
      <RoleGate kind="business">{children}</RoleGate>
    </ConsoleShell>
  );
}
