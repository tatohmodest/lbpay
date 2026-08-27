"use client";

import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  Repeat,
  ScrollText,
  Send,
  Webhook,
} from "lucide-react";
import { ConsoleShell } from "@/components/layout/shells";
import { RoleGate } from "@/components/role-gate";

const items = [
  { href: "/developers", label: "Dashboard", icon: LayoutDashboard },
  { href: "/developers/keys", label: "API Keys", icon: KeyRound },
  { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/developers/logs", label: "Logs", icon: ScrollText },
  { href: "/developers/payouts", label: "Payouts", icon: Send },
  { href: "/developers/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/developers/docs", label: "Docs", icon: BookOpen },
];

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      title="Developer Console"
      subtitle="Sandbox + live"
      items={items}
      cta={{ href: "/developers/docs", label: "API reference" }}
    >
      <RoleGate kind="developer">{children}</RoleGate>
    </ConsoleShell>
  );
}
