"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileCheck,
  ArrowLeftRight,
  Wallet,
  ScrollText,
} from "lucide-react";
import { ConsoleShell } from "@/components/layout/shells";
import { useAdminSession } from "@/components/role-gate";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/kyc", label: "KYC", icon: FileCheck },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
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

  return (
    <ConsoleShell title="Admin" subtitle="Platform control" items={items}>
      {children}
    </ConsoleShell>
  );
}
