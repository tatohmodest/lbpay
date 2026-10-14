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
import { useAdminSession } from "@/components/role-gate";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/support", label: "Chat with us", icon: MessageSquare, scope: "support" },
  { href: "/admin/users", label: "Users", icon: Users, scope: "users" },
  { href: "/admin/kyc", label: "KYC", icon: FileCheck, scope: "kyc" },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight, scope: "finance" },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet, scope: "finance" },
  { href: "/admin/audit", label: "Audit", icon: ScrollText, scope: "audit" },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const session = useAdminSession();

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

  return (
    <ConsoleShell
      title="Admin"
      subtitle={session.data?.owner ? "Owner" : "Staff"}
      items={allowed.map(({ href, label, icon }) => ({ href, label, icon }))}
    >
      {blocked ? (
        <div className="grid place-items-center rounded-[1.25rem] border border-line/80 bg-white px-6 py-16 text-center">
          <div>
            <ShieldAlert className="mx-auto h-9 w-9 text-muted" />
            <h1 className="mt-3 text-xl font-black">No access to {current?.label}</h1>
            <p className="mt-1 text-sm text-muted">Ask an owner to give you this permission.</p>
          </div>
        </div>
      ) : (
        children
      )}
    </ConsoleShell>
  );
}
