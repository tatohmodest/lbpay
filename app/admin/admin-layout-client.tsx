"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeftRight,
  FileCheck,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { ConsoleShell } from "@/components/layout/shells";
import { SectionBottomNav } from "@/components/layout/app-header";
import { useQuery } from "@tanstack/react-query";
import { useAdminSession } from "@/components/role-gate";

const items: Array<{ href: string; label: string; short?: string; icon: typeof LayoutDashboard; scope?: string }> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/support", label: "Chat with us", short: "Chats", icon: MessageSquare, scope: "support" },
  { href: "/admin/users", label: "Users", icon: Users, scope: "users" },
  { href: "/admin/kyc", label: "KYC", icon: FileCheck, scope: "kyc" },
  { href: "/admin/transactions", label: "Transactions", short: "Payments", icon: ArrowLeftRight, scope: "finance" },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet, scope: "finance" },
  { href: "/admin/audit", label: "Audit", icon: ScrollText, scope: "audit" },
];

const MOBILE_ORDER = ["/admin", "/admin/kyc", "/admin/support", "/admin/users", "/admin/transactions", "/admin/wallets", "/admin/audit"];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const session = useAdminSession();
  const ready = Boolean(session.data?.admin && !session.data.needOtp);
  // Same query as the overview page, so the tab badges cost no extra request there.
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load overview");
      return res.json() as Promise<{ stats?: { users?: { pendingKyc?: number } }; supportUnread?: number }>;
    },
    enabled: ready,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!session.isFetched) return;
    if (session.data?.status === 403) return;
    if (session.data?.needOtp && path !== "/admin/otp") router.replace("/admin/otp");
    if (session.data?.admin && !session.data.needOtp && path === "/admin/otp") router.replace("/admin");
  }, [session.isFetched, session.data, path, router]);

  if (!session.isFetched) {
    return <p className="grid min-h-screen place-items-center text-sm text-muted">Opening admin…</p>;
  }
  if (session.data?.status === 403) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <ShieldAlert className="mx-auto h-10 w-10 text-danger" />
          <h1 className="mt-4 text-2xl font-black">Admin only</h1>
          <p className="mt-2 text-sm text-muted">This console is limited to LBPay operators.</p>
        </div>
      </div>
    );
  }
  if (session.data?.needOtp && path !== "/admin/otp") {
    return <p className="grid min-h-screen place-items-center text-sm text-muted">Opening admin…</p>;
  }
  if (path === "/admin/otp") return <>{children}</>;

  const scopes = session.data?.scopes ?? [];
  const allowed = items.filter((item) => !item.scope || scopes.includes(item.scope));
  const current = items.find((item) => item.href !== "/admin" && path.startsWith(item.href));
  const blocked = Boolean(current?.scope && !scopes.includes(current.scope));

  // Mobile: the admin's own tabs (most used first, up to four) plus one button back to the wallet.
  const badges: Record<string, number | undefined> = {
    "/admin/kyc": overview.data?.stats?.users?.pendingKyc,
    "/admin/support": overview.data?.supportUnread,
  };
  const tabs = MOBILE_ORDER.map((href) => allowed.find((item) => item.href === href))
    .filter((item): item is (typeof items)[number] => Boolean(item))
    .slice(0, 4)
    .map((item) => ({ href: item.href, label: item.short ?? item.label, icon: item.icon, badge: badges[item.href] }));

  return (
    <ConsoleShell
      title="Admin"
      subtitle={session.data?.owner ? "Owner" : "Staff"}
      items={allowed.map(({ href, label, icon }) => ({ href, label, icon }))}
      bottomNav={<SectionBottomNav tabs={tabs} root="/admin" />}
    >
      {blocked ? (
        <div className="grid place-items-center rounded-[1.25rem] border border-line/80 bg-white px-6 py-16 text-center">
          <div>
            <ShieldAlert className="mx-auto h-9 w-9 text-muted" />
            <h1 className="mt-3 text-xl font-black">No access to {current?.label}</h1>
            <p className="mt-1 text-sm text-muted">Ask an admin with this permission to give it to you.</p>
          </div>
        </div>
      ) : (
        children
      )}
    </ConsoleShell>
  );
}
