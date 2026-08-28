"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Phone,
  QrCode,
  Receipt,
  Send,
  WalletCards,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { VerifyPrompt } from "@/components/verify-prompt";
import { CopyHandle } from "@/components/copy-handle";
import type { Transaction } from "@/lib/types";

const actions = [
  {
    href: "/wallet/quick",
    label: "Quick Transfer",
    copy: "Send money to any Mobile Money network",
    icon: Zap,
  },
  {
    href: "/wallet/send",
    label: "Send",
    copy: "Pay a friend, a shop, or any number",
    icon: Send,
  },
  {
    href: "/wallet/request",
    label: "Receive",
    copy: "Share a link and get paid",
    icon: WalletCards,
  },
  {
    href: "/wallet/qr",
    label: "My QR",
    copy: "Let anyone scan and pay you",
    icon: QrCode,
  },
];

const extras = [
  { href: "/wallet/history", label: "Transactions", copy: "Every payment in one place", icon: History },
  { href: "/wallet/airtime", label: "Airtime", copy: "Coming soon", icon: Phone },
  { href: "/wallet/bills", label: "Bills", copy: "Coming soon", icon: Receipt },
];

export default function WalletPage() {
  const { state } = useApp();
  const me = useMe();
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {frozen ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-danger lg:col-span-12">
          This account is frozen. Deposits, sends, and withdrawals are blocked until an admin restores it.
        </div>
      ) : null}
      <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />
      <div className="flex flex-col gap-6 lg:col-span-8">
        <section className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm text-white/80">Wallet Balance</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">
                {formatXAF(balance, { withCurrency: false })}{" "}
                <span className="text-2xl font-semibold opacity-80">XAF</span>
              </h1>
            </div>
            <CopyHandle
              handle={me.data?.user?.lbpayId || state.user.lbpayId}
              className="rounded-full bg-white/15 px-3 py-1 text-sm text-white hover:bg-white/25"
            />
          </div>
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
            <Link href="/wallet/deposit">
              <Button className="w-full bg-white text-brand hover:bg-brand-soft">
                <ArrowDownLeft className="h-4 w-4" /> Deposit
              </Button>
            </Link>
            <Link href="/wallet/withdraw">
              <Button className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="flex h-full flex-col gap-3 p-4 transition hover:border-brand/40 hover:shadow-[0_10px_30px_rgba(0,179,105,0.12)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <action.icon className="h-5 w-5" />
                </div>
                <span>
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{action.copy}</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
        <div className="grid gap-2">
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-brand/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-brand">
                <item.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.copy}</span>
              </span>
            </Link>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Recent activity
            </h2>
            <Link href="/wallet/history" className="text-sm font-bold text-brand">
              View all
            </Link>
          </div>
          <div className="divide-y divide-line">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No movements yet. Deposit or receive to get started.</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{tx.counterparty}</p>
                    <p className="text-xs text-muted">
                      {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
                      {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {isMoneyOut(tx.kind) ? "−" : "+"}
                      {formatXAF(tx.amount, { withCurrency: false })}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-4">
        <Card className="p-5">
          <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand">
            <Zap className="h-3.5 w-3.5" /> Fast transfer
          </p>
          <h2 className="mt-2 text-lg font-bold">Quick Transfer</h2>
          <p className="mt-1 text-sm text-muted">
            Send money to any Mobile Money network. MTN to Orange, easily.
          </p>
          <Link href="/wallet/quick" className="mt-4 block">
            <Button className="w-full">Open Quick Transfer</Button>
          </Link>
          <Link href="/wallet/send" className="mt-2 block text-center text-sm font-semibold text-brand">
            Wallet send instead
          </Link>
        </Card>

        <Card className="overflow-hidden">
          <Image
            src="/illustrations/cross-network.png"
            alt="MTN to Orange"
            width={800}
            height={540}
            className="h-40 w-full object-cover"
          />
          <div className="p-4">
            <p className="text-sm font-semibold">Get paid with your QR or @handle</p>
            <Link href="/wallet/qr" className="mt-2 inline-block text-sm font-bold text-brand">
              Show my QR
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
