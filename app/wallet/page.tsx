"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { CopyHandle } from "@/components/copy-handle";
import {
  ActionRail,
  BalanceHero,
  FeedTabs,
  HubNone,
  MoneyRow,
  PromoBanner,
  SearchJump,
  SparkCard,
} from "@/components/money-hub";
import { VerifyPrompt } from "@/components/verify-prompt";
import { InviteSomeone } from "@/components/invite-someone";
import { ContactRow } from "@/components/wallet-contacts";
import { contactInitials, contactsFromTransactions } from "@/lib/contacts";
import { dayNet, firstName, formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { txHref } from "@/lib/tx";
import type { Transaction } from "@/lib/types";

const actions = [
  { href: "/wallet/send", label: "Send", icon: Send },
  { href: "/wallet/request", label: "Receive", icon: WalletCards },
  { href: "/wallet/deposit", label: "Deposit", icon: ArrowDownLeft },
  { href: "/wallet/withdraw", label: "Withdraw", icon: ArrowUpRight },
  { href: "/wallet/qr", label: "QR", icon: QrCode },
] as const;

const extras = [
  { href: "/wallet/quick", label: "Quick", copy: "Any network", icon: Zap },
  { href: "/wallet/airtime", label: "Airtime", copy: "Coming soon", icon: Phone },
  { href: "/wallet/bills", label: "Bills", copy: "Coming soon", icon: Receipt },
];

const tabs = [
  { id: "activity", label: "Activity" },
  { id: "people", label: "People" },
  { id: "incoming", label: "Incoming" },
];

export default function WalletPage() {
  const { state } = useApp();
  const me = useMe();
  const [tab, setTab] = useState("activity");
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const contacts = contactsFromTransactions(transactions);
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";
  const user = me.data?.user;
  const person = firstName(user?.name || state.user.name) || "there";
  const handle = user?.lbpayId || state.user.lbpayId;
  const pending = useMemo(
    () => transactions.filter((tx) => tx.status === "pending" && !isMoneyOut(tx.kind)),
    [transactions],
  );
  const pendingIn = pending.reduce((sum, tx) => sum + tx.amount, 0);
  const today = dayNet(transactions);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        {frozen ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-danger">
            This account is frozen. Deposits, sends, and withdrawals are blocked until an admin restores it.
          </div>
        ) : null}
        <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />

        <header className="flex items-center gap-3">
          <AppImg
            src={user?.avatar || state.user.avatar}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{person}</p>
            {handle ? (
              <CopyHandle handle={handle} className="-ml-1 text-xs text-muted hover:text-ink" />
            ) : (
              <p className="truncate text-xs text-muted">Your wallet</p>
            )}
          </div>
          <Link
            href="/wallet/qr"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink ring-1 ring-line/80"
            aria-label="Show my QR"
          >
            <QrCode className="h-4 w-4" />
          </Link>
        </header>

        <SearchJump href="/wallet/send" placeholder="Number or @handle" />

        <BalanceHero
          label="Total (XAF)"
          amount={balance}
          delta={today}
          cta={{ href: "/wallet/deposit", label: "Add money" }}
        />

        <ActionRail items={[...actions]} />

        <PromoBanner
          kicker="Quick"
          title="Send across MTN and Orange."
          href="/wallet/quick"
          cta="Send"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <SparkCard
            href="/wallet/contacts"
            title="People"
            value={contacts.length ? String(contacts.length) : "None"}
            hint="Send again"
            faces={contacts.slice(0, 3).map((contact) => contactInitials(contact.label))}
          />
          <SparkCard
            href="/wallet/history"
            title="Incoming"
            value={pendingIn ? formatXAF(pendingIn, { withCurrency: false }) : "None"}
            hint={pendingIn ? "On the way" : "Nothing pending"}
          />
        </div>
      </div>

      <div className="space-y-5 lg:col-span-7">
        <section>
          <FeedTabs
            tabs={tabs}
            active={tab}
            onChange={setTab}
            moreHref={tab === "people" ? "/wallet/contacts" : "/wallet/history"}
          />
          <div className="pt-1">
            {tab === "people" ? (
              contacts.length ? (
                contacts.slice(0, 8).map((contact) => <ContactRow key={contact.key} contact={contact} />)
              ) : (
                <HubNone />
              )
            ) : null}
            {tab === "incoming" ? (
              pending.length ? (
                pending.slice(0, 8).map((tx) => (
                  <MoneyRow
                    key={tx.id}
                    href={txHref(tx.id)}
                    mark={tx.counterparty.trim().slice(0, 1).toUpperCase() || "?"}
                    title={tx.counterparty}
                    meta={`${tx.kind.replace("_", " ")} · ${formatDate(tx.createdAt)}`}
                    amount={`+${formatXAF(tx.amount, { withCurrency: false })}`}
                    tone="in"
                    badge={<StatusBadge status={tx.status} />}
                  />
                ))
              ) : (
                <HubNone />
              )
            ) : null}
            {tab === "activity" ? (
              transactions.length ? (
                transactions.slice(0, 8).map((tx) => {
                  const out = isMoneyOut(tx.kind);
                  return (
                    <MoneyRow
                      key={tx.id}
                      href={txHref(tx.id)}
                      mark={tx.counterparty.trim().slice(0, 1).toUpperCase() || "?"}
                      title={tx.counterparty}
                      meta={`${tx.kind.replace("_", " ")} · ${formatDate(tx.createdAt)}`}
                      amount={`${out ? "−" : "+"}${formatXAF(tx.amount, { withCurrency: false })}`}
                      tone={out ? "out" : "in"}
                      badge={<StatusBadge status={tx.status} />}
                    />
                  );
                })
              ) : (
                <HubNone />
              )
            ) : null}
          </div>
        </section>

        <InviteSomeone />

        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line/80">
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef1ef] text-ink">
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
    </div>
  );
}
