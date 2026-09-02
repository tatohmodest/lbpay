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
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import { HouseCard, MetricCard, WalletTile } from "@/components/house-card";
import { CashFlow, monthlyInflow } from "@/components/cash-flow";
import { CopyHandle } from "@/components/copy-handle";
import { firstName, formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { VerifyPrompt } from "@/components/verify-prompt";
import { InviteSomeone } from "@/components/invite-someone";
import { ContactsStrip } from "@/components/wallet-contacts";
import { contactsFromTransactions, contactFromTransaction, contactSendHref } from "@/lib/contacts";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

const tiles = [
  { href: "/wallet/quick", label: "Quick", copy: "Any network", icon: Zap, wrap: "bg-brand-soft text-brand-deep" },
  { href: "/wallet/send", label: "Send", copy: "To a friend", icon: Send, wrap: "bg-[#e4eef8] text-[#3a5f86]" },
  { href: "/wallet/request", label: "Receive", copy: "Get paid", icon: WalletCards, wrap: "bg-[#f4ead2] text-[#8a691f]" },
  { href: "/wallet/qr", label: "QR", copy: "Scan me", icon: QrCode, wrap: "bg-[#ece6f8] text-[#5b4a8a]" },
] as const;

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
  const handle = user?.lbpayId || state.user.lbpayId;
  const bars = monthlyInflow(transactions);
  const pendingIn = transactions
    .filter((tx) => tx.status === "pending" && !isMoneyOut(tx.kind))
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:max-w-none">
      {frozen ? (
        <div className="rounded-[1.25rem] bg-red-50 p-4 text-sm font-semibold text-danger">
          This account is frozen. Deposits, sends, and withdrawals are blocked until an admin restores it.
        </div>
      ) : null}
      <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />

      <header className="flex items-center gap-3">
        <AppImg
          src={user?.avatar || state.user.avatar}
          alt=""
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-[0_8px_20px_rgba(12,25,19,0.08)]"
        />
        <div className="min-w-0">
          <p className="text-lg font-black tracking-tight text-ink">Hello, {person}</p>
          {handle ? (
            <CopyHandle handle={handle} className="-ml-1 text-sm text-muted hover:text-ink" />
          ) : (
            <p className="truncate text-sm text-muted">Your wallet</p>
          )}
        </div>
      </header>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">Here is your money at a glance.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <HouseCard
            title="My balance"
            subtitle="Wallet overview"
            amount={balance}
            handle={handle}
            detailsHref="/wallet/history"
          />
        </div>
        <MetricCard
          href="/wallet/deposit"
          icon={ArrowDownLeft}
          iconWrap="bg-[#ece6f8] text-[#5b4a8a]"
          label="Deposit"
          value="Add money"
          hint="MTN MoMo or Orange Money"
          status="Open"
        />
        <MetricCard
          href="/wallet/withdraw"
          icon={ArrowUpRight}
          iconWrap="bg-[#e4eef8] text-[#3a5f86]"
          label="Withdraw"
          value="Cash out"
          hint={pendingIn ? `${formatXAF(pendingIn)} still on the way` : "To your Mobile Money number"}
          status="Open"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] lg:col-span-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-black">My wallet</h2>
              <p className="mt-0.5 text-xs text-muted">Send, receive, and pay from here.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
              <WalletTile
                key={tile.href}
                href={tile.href}
                icon={tile.icon}
                iconWrap={tile.wrap}
                label={tile.label}
                copy={tile.copy}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <CashFlow bars={bars} />
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">People</h2>
            <p className="mt-0.5 text-xs text-muted">Contacts from past sends.</p>
          </div>
          {contacts.length ? (
            <Link href="/wallet/contacts" className="text-sm font-bold text-ink/70">
              See all
            </Link>
          ) : null}
        </div>
        <ContactsStrip contacts={contacts.slice(0, 8)} />
      </section>

      <section className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">Recent activities</h2>
            <p className="mt-0.5 text-xs text-muted">Latest money in and out.</p>
          </div>
          {transactions.length ? (
            <Link href="/wallet/history" className="text-sm font-bold text-ink/70">
              See all
            </Link>
          ) : null}
        </div>
        <div className="mt-2 space-y-0.5">
          {transactions.length === 0 ? (
            <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
          ) : (
            transactions.slice(0, 6).map((tx) => {
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

      <section className="overflow-hidden rounded-[1.25rem] border border-line/80 bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {extras.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-paper text-ink">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink">{item.label}</span>
              <span className="block text-xs text-muted">{item.copy}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="overflow-hidden rounded-[1.25rem] border border-line/80 bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)] lg:hidden">
        <Image
          src="/illustrations/cross-network.webp"
          alt="MTN to Orange"
          width={800}
          height={540}
          className="h-36 w-full object-cover"
        />
        <div className="p-5">
          <p className="text-sm font-bold">Get paid with your QR or @handle</p>
          <Link href="/wallet/qr" className="mt-2 inline-block text-sm font-bold text-brand">
            Show my QR
          </Link>
        </div>
      </section>
    </div>
  );
}
