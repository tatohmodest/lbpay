"use client";

import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Send,
  Webhook,
} from "lucide-react";
import { ConsoleShell, WalletShell } from "@/components/layout/shells";
import { RoleGate } from "@/components/role-gate";
import { useMe } from "@/lib/hooks/wallet";
import { productUnlocked } from "@/lib/roles";

const items = [
  { href: "/developers", label: "API Dashboard", icon: LayoutDashboard },
  { href: "/developers/keys", label: "Applications", icon: KeyRound },
  { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/developers/logs", label: "Logs", icon: ScrollText },
  { href: "/developers/payouts", label: "Test payouts", icon: Send },
  { href: "/developers/docs", label: "Documentation", icon: BookOpen },
];

export function DevelopersLayoutClient({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const unlocked = productUnlocked(me.data?.user, "developer");

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
        <RoleGate kind="developer">{children}</RoleGate>
      </WalletShell>
    );
  }

  return (
    <ConsoleShell
      title="Developer Portal"
      subtitle="Payments for your product"
      items={items}
      cta={{ href: "/developers/docs", label: "API reference" }}
    >
      <RoleGate kind="developer">{children}</RoleGate>
    </ConsoleShell>
  );
}
