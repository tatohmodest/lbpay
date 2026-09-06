"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, Plus, QrCode, Receipt, Zap } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import { CopyHandle } from "@/components/copy-handle";
import { FeedTabs, MoneyRow, SearchJump } from "@/components/money-hub";
import { PlanCard, SavingsEmpty } from "@/components/savings";
import { AbroadCard, ActionGrid, NextMove, SectionHead, WalletBalance, WeekPulse, buildNudges } from "@/components/wallet-home";
import { VerifyPrompt } from "@/components/verify-prompt";
import { InviteSomeone } from "@/components/invite-someone";
import { ContactRow } from "@/components/wallet-contacts";
import { BusinessPromo } from "@/components/business-promo";
import { ACTION_ART } from "@/lib/assets";
import { contactsFromTransactions } from "@/lib/contacts";
import { dayNet, formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { payHandleUrl } from "@/lib/origin";
import { productUnlocked } from "@/lib/roles";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { kindTitle, txHref } from "@/lib/tx";
import { useBrowserOrigin } from "@/lib/use-origin";
import type { SavingsPlan, Transaction } from "@/lib/types";

const actions = [
  { href: "/wallet/send", label: "Send", art: ACTION_ART.send },
  { href: "/wallet/savings", label: "Save", art: ACTION_ART.save, badge: "New" },
  { href: "/wallet/international", label: "Abroad", art: ACTION_ART.abroad, badge: "Soon" },
  { href: "/wallet/request", label: "Receive", art: ACTION_ART.receive },
  { href: "/wallet/deposit", label: "Deposit", art: ACTION_ART.deposit },
  { href: "/wallet/withdraw", label: "Withdraw", art: ACTION_ART.withdraw },
  { href: "/wallet/quick", label: "Quick", art: ACTION_ART.quick },
  { href: "/wallet/qr", label: "QR", art: ACTION_ART.qr },
];

const extras = [
  { href: "/wallet/quick", label: "Quick transfer", copy: "MTN ↔ Orange, any network", icon: Zap },
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
  const origin = useBrowserOrigin();
  const [tab, setTab] = useState("activity");
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const savings = me.data?.savings as SavingsPlan[] | undefined;
  const plans = useMemo(() => savings ?? [], [savings]);
  const activePlans = plans.filter((p) => p.status === "active");
  const saved = plans.reduce((sum, p) => sum + p.balance, 0);
  const streak = activePlans.reduce((best, p) => Math.max(best, p.streak), 0);
  const contacts = contactsFromTransactions(transactions);
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";
  const user = me.data?.user;
  const handle = user?.lbpayId || state.user.lbpayId;
  const payUrl = handle && origin ? payHandleUrl(handle, origin) : "";
  const showBusinessPromo = !productUnlocked(user || state.user, "business");
  const pending = useMemo(
    () => transactions.filter((tx) => tx.status === "pending" && !isMoneyOut(tx.kind)),
    [transactions],
  );
  const today = dayNet(transactions);
  const nudges = useMemo(
    () => buildNudges({ balance, plans, transactions, contactsCount: contacts.length, kyc: personalKyc }),
    [balance, plans, transactions, contacts.length, personalKyc],
  );
  const orderedPlans = [...activePlans].sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));

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
            <p className="truncate text-[15px] font-bold text-ink">{user?.name || state.user.name || "Your wallet"}</p>
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

        <WalletBalance amount={balance} saved={saved} delta={today} payUrl={payUrl} />

        <ActionGrid items={actions} />

        <section className="space-y-2.5">
          <h2 className="px-1 text-[15px] font-black text-ink">For you</h2>
          {showBusinessPromo ? (
            <BusinessPromo href="/business" />
          ) : (
            <BusinessPromo
              href="/business/links"
              title="Your shop is live"
              subtitle="Share a product or the whole catalogue. Customers pay you directly."
              cta="Open shop"
            />
          )}
        </section>

        <NextMove nudges={nudges} />

        <SearchJump href="/wallet/send" placeholder="Send to a number or @handle" />

        <section className="space-y-2.5">
          <SectionHead title="Savings pots" href="/wallet/savings" action={activePlans.length ? "Manage" : undefined} />
          {orderedPlans.length ? (
            <div className="space-y-2">
              {orderedPlans.slice(0, 2).map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
              <div className="flex items-center gap-2">
                <Link
                  href="/wallet/savings?new=1"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-bold text-ink ring-1 ring-line/80 hover:bg-paper"
                >
                  <Plus className="h-4 w-4" /> New pot
                </Link>
                {orderedPlans.length > 2 ? (
                  <Link href="/wallet/savings" className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-brand-deep hover:underline">
                    +{orderedPlans.length - 2} more
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <SavingsEmpty />
          )}
        </section>
      </div>

      <div className="space-y-5 lg:col-span-7">
        <WeekPulse transactions={transactions} streak={streak} />

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
                <EmptyFeed title="No one yet" copy="Send money once and the person shows up here for a two-tap repeat." href="/wallet/send" cta="Send money" />
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
                    meta={`${kindTitle(tx.kind)} · ${formatDate(tx.createdAt)}`}
                    amount={`+${formatXAF(tx.amount, { withCurrency: false })}`}
                    tone="in"
                    badge={<StatusBadge status={tx.status} />}
                  />
                ))
              ) : (
                <EmptyFeed title="Nothing on the way" copy="Share your @handle or a payment link and incoming money shows up here." href="/wallet/request" cta="Request money" />
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
                      mark={tx.kind === "savings_in" || tx.kind === "penalty" ? "🐷" : tx.kind === "international" ? "🌍" : tx.counterparty.trim().slice(0, 1).toUpperCase() || "?"}
                      title={tx.counterparty}
                      meta={`${kindTitle(tx.kind)} · ${formatDate(tx.createdAt)}`}
                      amount={`${out ? "−" : "+"}${formatXAF(tx.amount, { withCurrency: false })}`}
                      tone={out ? "out" : "in"}
                      badge={<StatusBadge status={tx.status} />}
                    />
                  );
                })
              ) : (
                <EmptyFeed title="No activity yet" copy="Add money, then send, save or pay. Everything you do lands here." href="/wallet/deposit" cta="Add money" />
              )
            ) : null}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <AbroadCard />
          <InviteSomeone />
        </div>

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

function EmptyFeed({ title, copy, href, cta }: { title: string; copy: string; href: string; cta: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-8 text-center ring-1 ring-line/80">
      <p className="text-sm font-black text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted">{copy}</p>
      <Link href={href} className="mt-3 inline-flex h-9 items-center rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
        {cta}
      </Link>
    </div>
  );
}
