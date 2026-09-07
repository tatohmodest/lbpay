"use client";

import { BusinessMobileTabs } from "@/components/business/mobile-tabs";
import { ConsoleShell, WalletShell } from "@/components/layout/shells";
import { RoleGate } from "@/components/role-gate";
import { ACTION_ART } from "@/lib/assets";
import { useMe } from "@/lib/hooks/wallet";
import { productUnlocked } from "@/lib/roles";

const items = [
  { href: "/business", label: "Overview", art: ACTION_ART.business },
  { href: "/business/payments", label: "Sales", art: ACTION_ART.sales },
  { href: "/business/invoices", label: "Invoices", art: ACTION_ART.invoices },
  { href: "/business/customers", label: "Customers", art: ACTION_ART.people },
  { href: "/business/links", label: "Links", art: ACTION_ART.products },
  { href: "/business/analytics", label: "Analytics", art: ACTION_ART.analytics },
  { href: "/business/settlements", label: "Settlement", art: ACTION_ART.wallet },
  { href: "/business/qr", label: "QR", art: ACTION_ART.qr },
  { href: "/business/settings", label: "Settings", art: ACTION_ART.settings },
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
      <RoleGate kind="business">
        <BusinessMobileTabs />
        {children}
      </RoleGate>
    </ConsoleShell>
  );
}
