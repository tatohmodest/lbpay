"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, FileCheck, MessageSquare, Users, Wallet } from "lucide-react";
import { AppImg } from "@/components/app-img";
import { AdminHeader, AdminPanel, AdminStat } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { kindTitle } from "@/lib/tx";

const shortcuts = [
  { href: "/admin/support", label: "Chat with us", copy: "Reply to people in the app", icon: MessageSquare },
  { href: "/admin/kyc", label: "Review KYC", copy: "Approve identity and shops", icon: FileCheck },
  { href: "/admin/users", label: "Users", copy: "Freeze, restore, grant roles", icon: Users },
  { href: "/admin/transactions", label: "Transactions", copy: "Reverse or mark status", icon: ArrowLeftRight },
  { href: "/admin/wallets", label: "Wallets", copy: "Credit or debit a ledger", icon: Wallet },
];

export default function AdminHome() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load overview");
      return res.json() as Promise<{
        users: number;
        frozen: number;
        pendingKyc: number;
        transactions: number;
        volume: number;
        ledger: number;
        recent: Array<{
          id: string;
          kind: string;
          amount: number;
          status: "success" | "failed" | "pending" | "cancelled" | "expired";
          counterparty: string;
          createdAt: string;
        }>;
        people: Array<{ id: string; name: string; lbpayId: string; avatar: string; status: string }>;
        supportUnread?: number;
      }>;
    },
  });
  const data = overview.data;

  return (
    <div className="space-y-5">
      <AdminHeader title="Overview" copy="Keep the platform running." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2">
          <AdminStat
            tone="green"
            label="Ledger"
            value={data ? formatXAF(data.ledger, { withCurrency: false }) : "…"}
            hint="XAF across every wallet"
          />
        </div>
        <AdminStat label="Users" value={data?.users ?? "…"} hint={data ? `${data.frozen} frozen` : undefined} />
        <AdminStat label="Pending KYC" value={data?.pendingKyc ?? "…"} hint={data ? `${data.transactions} tx` : undefined} />
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.15rem] border border-line/70 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:border-brand/30"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-deep">
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-4 text-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-xs text-muted">
              {item.href === "/admin/support" && data?.supportUnread
                ? `${data.supportUnread} waiting`
                : item.copy}
            </p>
          </Link>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AdminPanel
            title="Recent activity"
            copy="Latest movements on the ledger."
            action={
              <Link href="/admin/transactions" className="text-sm font-bold text-ink/70">
                See all
              </Link>
            }
          >
            {(data?.recent || []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">None</p>
            ) : (
              (data?.recent || []).map((tx) => (
                <Link
                  key={tx.id}
                  href={`/admin/transactions?q=${encodeURIComponent(tx.id)}`}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-paper"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{tx.counterparty}</p>
                    <p className="text-xs text-muted">
                      {kindTitle(tx.kind)} · {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="font-mono text-sm font-black">{formatXAF(tx.amount, { withCurrency: false })}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                </Link>
              ))
            )}
          </AdminPanel>
        </div>
        <div className="lg:col-span-5">
          <AdminPanel
            title="People"
            copy="Newest accounts."
            action={
              <Link href="/admin/users" className="text-sm font-bold text-ink/70">
                See all
              </Link>
            }
          >
            {(data?.people || []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">None</p>
            ) : (
              (data?.people || []).map((user) => (
                <Link
                  key={user.id}
                  href="/admin/users"
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-paper"
                >
                  <AppImg
                    src={user.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-muted">@{user.lbpayId}</p>
                  </div>
                </Link>
              ))
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
