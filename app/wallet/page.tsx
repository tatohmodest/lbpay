"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PlanCard, SavingsEmpty } from "@/components/savings";
import { NextMove, buildNudges } from "@/components/wallet-home";
import { ActivityList, BalanceHero, DashEmpty, DashSection, QuickActions } from "@/components/wallet-dashboard";
import { VerifyPrompt } from "@/components/verify-prompt";
import { InviteSomeone } from "@/components/invite-someone";
import { ContactRow } from "@/components/wallet-contacts";
import { BusinessPromo } from "@/components/business-promo";
import { contactsFromTransactions } from "@/lib/contacts";
import { dayNet } from "@/lib/format";
import { productUnlocked } from "@/lib/roles";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { SavingsPlan, Transaction } from "@/lib/types";

export default function WalletPage() {
  const { state } = useApp();
  const me = useMe();
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const savings = me.data?.savings as SavingsPlan[] | undefined;
  const plans = useMemo(() => savings ?? [], [savings]);
  const activePlans = plans.filter((p) => p.status === "active");
  const saved = plans.reduce((sum, p) => sum + p.balance, 0);
  const contacts = contactsFromTransactions(transactions);
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";
  const user = me.data?.user;
  const showBusinessPromo = !productUnlocked(user || state.user, "business");
  const today = dayNet(transactions);
  const nudges = useMemo(
    () => buildNudges({ balance, plans, transactions, contactsCount: contacts.length, kyc: personalKyc }),
    [balance, plans, transactions, contacts.length, personalKyc],
  );
  const orderedPlans = [...activePlans].sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-6 lg:col-span-5">
        {frozen ? (
          <div className="rounded-2xl bg-[#fdecea] p-4 text-[14px] font-semibold text-danger">
            This account is frozen. Adding, sending and withdrawing money are paused until our team restores it.
          </div>
        ) : null}

        <BalanceHero name={user?.name || state.user.name || ""} balance={balance} saved={saved} today={today} />
        <QuickActions />
        <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />
        <NextMove nudges={nudges} />

        <DashSection title="Savings pots" href="/wallet/savings" action={activePlans.length ? "Manage" : undefined}>
          {orderedPlans.length ? (
            <div className="space-y-2">
              {orderedPlans.slice(0, 2).map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
              <Link
                href="/wallet/savings?new=1"
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line text-[14px] font-semibold text-ink transition hover:border-brand/50"
              >
                <Plus className="h-4 w-4" /> New pot
                {orderedPlans.length > 2 ? <span className="text-muted">· {orderedPlans.length - 2} more</span> : null}
              </Link>
            </div>
          ) : (
            <SavingsEmpty />
          )}
        </DashSection>
      </div>

      <div className="space-y-6 lg:col-span-7">
        <DashSection title="Recent activity" href="/wallet/history">
          <ActivityList
            transactions={transactions}
            limit={8}
            empty={
              <DashEmpty
                icon={Plus}
                title="Nothing here yet"
                copy="Add money from MTN or Orange, then send, save or get paid. Everything shows up here."
                href="/wallet/deposit"
                cta="Add money"
              />
            }
          />
        </DashSection>

        {contacts.length ? (
          <DashSection title="Send again" href="/wallet/contacts">
            <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-line/80">
              {contacts.slice(0, 4).map((contact) => (
                <ContactRow key={contact.key} contact={contact} />
              ))}
            </div>
          </DashSection>
        ) : null}

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
        <InviteSomeone />
      </div>
    </div>
  );
}
