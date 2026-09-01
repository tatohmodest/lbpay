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
    copy: "Any Mobile Money network",
    icon: Zap,
  },
  {
    href: "/wallet/send",
    label: "Send",
    copy: "A friend, a shop, a number",
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
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:gap-6 lg:space-y-0">
      {frozen ? (
        <div className="rounded-[1.5rem] bg-red-50 p-4 text-sm font-semibold text-danger lg:col-span-12">
          This account is frozen. Deposits, sends, and withdrawals are blocked until an admin restores it.
        </div>
      ) : null}
      <div className="lg:col-span-12">
        <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />
      </div>

      <div className="space-y-5 lg:col-span-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-white shadow-[0_24px_80px_rgba(6,38,28,0.18)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Wallet</p>
              <h1 className="mt-3 font-mono text-4xl font-black tracking-tight md:text-5xl">
                {formatXAF(balance, { withCurrency: false })}{" "}
                <span className="text-2xl font-bold text-white/70">XAF</span>
              </h1>
            </div>
            <CopyHandle
              handle={me.data?.user?.lbpayId || state.user.lbpayId}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
            />
          </div>
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
            <Link href="/wallet/deposit">
              <Button className="h-12 w-full rounded-full bg-white text-brand hover:bg-brand-soft">
                <ArrowDownLeft className="h-4 w-4" /> Deposit
              </Button>
            </Link>
            <Link href="/wallet/withdraw">
              <Button className="h-12 w-full rounded-full border-0 bg-white/10 text-white hover:bg-white/15">
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </Button>
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <div className="grid grid-cols-2 gap-1">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col gap-3 rounded-[1.5rem] p-4 transition hover:bg-paper"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <action.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{action.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{action.copy}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-paper text-brand">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.copy}</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Activity</p>
              <h2 className="mt-1 text-lg font-black">Recent</h2>
            </div>
            <Link href="/wallet/history" className="text-sm font-bold text-brand">
              View all
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {transactions.length === 0 ? (
              <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">
                No movements yet. Deposit or receive to get started.
              </p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl px-3 py-3 hover:bg-paper">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{tx.counterparty}</p>
                    <p className="text-xs text-muted">
                      {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
                      {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="font-mono text-sm font-black">
                      {isMoneyOut(tx.kind) ? "−" : "+"}
                      {formatXAF(tx.amount, { withCurrency: false })}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="space-y-5 lg:col-span-4">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            <Zap className="h-3.5 w-3.5" /> Fast transfer
          </p>
          <h2 className="mt-2 text-xl font-black">Quick Transfer</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Send money to any Mobile Money network. MTN to Orange, easily.
          </p>
          <Link href="/wallet/quick" className="mt-5 block">
            <Button className="w-full">Open Quick Transfer</Button>
          </Link>
          <Link href="/wallet/send" className="mt-3 block text-center text-sm font-bold text-brand">
            Wallet send instead
          </Link>
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <Image
            src="/illustrations/cross-network.webp"
            alt="MTN to Orange"
            width={800}
            height={540}
            className="h-40 w-full object-cover"
          />
          <div className="p-5">
            <p className="text-sm font-bold">Get paid with your QR or @handle</p>
            <Link href="/wallet/qr" className="mt-2 inline-block text-sm font-bold text-brand">
              Show my QR
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
