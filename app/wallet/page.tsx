"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  QrCode,
  Receipt,
  Send,
  WalletCards,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import { HouseCard } from "@/components/house-card";
import { firstName, formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { VerifyPrompt } from "@/components/verify-prompt";
import { InviteSomeone } from "@/components/invite-someone";
import { ContactsStrip } from "@/components/wallet-contacts";
import { contactsFromTransactions, contactFromTransaction, contactSendHref } from "@/lib/contacts";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

const actions = [
  { href: "/wallet/quick", label: "Quick", copy: "Any network", icon: Zap, tone: "leaf" },
  { href: "/wallet/send", label: "Send", copy: "A friend", icon: Send, tone: "mist" },
  { href: "/wallet/request", label: "Receive", copy: "Get paid", icon: WalletCards, tone: "sand" },
  { href: "/wallet/qr", label: "QR", copy: "Scan me", icon: QrCode, tone: "lilac" },
] as const;

const tones: Record<(typeof actions)[number]["tone"], string> = {
  leaf: "bg-brand-soft text-brand-deep",
  mist: "bg-[#e4eef8] text-[#3a5f86]",
  sand: "bg-[#f4ead2] text-[#8a691f]",
  lilac: "bg-[#ece6f8] text-[#5b4a8a]",
};

const extras = [
  { href: "/wallet/airtime", label: "Airtime", copy: "Coming soon", icon: Phone },
  { href: "/wallet/bills", label: "Bills", copy: "Coming soon", icon: Receipt },
];

export default function WalletPage() {
  const { state } = useApp();
  const me = useMe();
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const contacts = contactsFromTransactions(transactions);
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";
  const user = me.data?.user;
  const person = firstName(user?.name || state.user.name) || "there";
  const holder = user?.name || state.user.name || "LBPay";
  const handle = user?.lbpayId || state.user.lbpayId;
  const series = transactions
    .filter((tx) => tx.status === "success")
    .slice(0, 8)
    .map((tx) => tx.amount)
    .reverse();

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
        <header className="flex items-center gap-3">
          <AppImg
            src={user?.avatar || state.user.avatar}
            alt=""
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-[0_8px_20px_rgba(12,25,19,0.08)]"
          />
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-ink">Hello, {person}</p>
            <p className="truncate text-sm text-muted">{handle ? `@${handle.replace(/^@/, "")}` : "Your wallet"}</p>
          </div>
        </header>

        <HouseCard label="Available" amount={balance} holder={holder} handle={handle} series={series} />

        <div className="grid grid-cols-2 gap-2">
          <Link href="/wallet/deposit">
            <Button className="h-11 w-full rounded-full">
              <ArrowDownLeft className="h-4 w-4" /> Deposit
            </Button>
          </Link>
          <Link href="/wallet/withdraw">
            <Button className="h-11 w-full rounded-full" variant="secondary">
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </Button>
          </Link>
        </div>

        <section className="grid grid-cols-4 gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-[1.25rem] bg-white px-1.5 py-3 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:bg-[#faf8f4]"
            >
              <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", tones[action.tone])}>
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-center">
                <span className="block text-[12px] font-bold text-ink">{action.label}</span>
                <span className="mt-0.5 block text-[10px] leading-3 text-muted">{action.copy}</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">People</p>
              <h2 className="mt-1 text-base font-black">Contacts</h2>
            </div>
            {contacts.length ? (
              <Link href="/wallet/contacts" className="text-sm font-bold text-brand">
                See all
              </Link>
            ) : null}
          </div>
          <ContactsStrip contacts={contacts.slice(0, 8)} />
        </section>

        <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Activity</p>
              <h2 className="mt-1 text-base font-black">History</h2>
            </div>
            {transactions.length ? (
              <Link href="/wallet/history" className="text-sm font-bold text-brand">
                See all
              </Link>
            ) : null}
          </div>
          <div className="mt-2 space-y-0.5">
            {transactions.length === 0 ? (
              <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
            ) : (
              transactions.slice(0, 5).map((tx) => {
                const contact = contactFromTransaction(tx);
                const row = (
                  <div className="flex items-center justify-between rounded-2xl px-1.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{tx.counterparty}</p>
                      <p className="text-xs text-muted">
                        {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
                        {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p
                        className={cn(
                          "font-mono text-sm font-black",
                          isMoneyOut(tx.kind) ? "text-ink" : "text-brand-deep",
                        )}
                      >
                        {isMoneyOut(tx.kind) ? "−" : "+"}
                        {formatXAF(tx.amount, { withCurrency: false })}
                      </p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                );
                if (!contact) {
                  return (
                    <div key={tx.id} className="rounded-2xl">
                      {row}
                    </div>
                  );
                }
                return (
                  <Link
                    key={tx.id}
                    href={contactSendHref(contact)}
                    className="block rounded-2xl transition hover:bg-paper"
                  >
                    {row}
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <InviteSomeone />

        <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-paper text-brand">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.copy}</span>
              </span>
            </Link>
          ))}
        </section>
      </div>

      <div className="space-y-5 lg:col-span-4">
        <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
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

        <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
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
