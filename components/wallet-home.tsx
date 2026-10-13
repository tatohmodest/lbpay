"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { FEATURES } from "@/lib/flags";
import { formatXAF, isMoneyOut } from "@/lib/format";
import { dueState, penaltyFor, timeUntil } from "@/lib/savings";
import type { SavingsPlan, Transaction } from "@/lib/types";
import { HABIT_ART } from "@/lib/assets";
import { cn } from "@/lib/cn";


export type ActionTile = { href: string; label: string; art: string; badge?: string };

export type Nudge = {
  id: string;
  tone: "brand" | "gold" | "danger" | "ink";
  kicker: string;
  title: string;
  copy: string;
  href: string;
  cta: string;
  art?: string;
};

export function buildNudges({
  balance,
  plans,
  transactions,
  contactsCount,
  kyc,
}: {
  balance: number;
  plans: SavingsPlan[];
  transactions: Transaction[];
  contactsCount: number;
  kyc: string;
}): Nudge[] {
  const out: Nudge[] = [];
  const active = plans.filter((p) => p.status === "active");
  const overdue = active.filter((p) => dueState(p) === "overdue").sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));
  const dueToday = active.filter((p) => dueState(p) === "today").sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));

  if (overdue[0]) {
    const p = overdue[0];
    out.push({
      id: `overdue-${p.id}`,
      tone: "danger",
      kicker: "Missed save",
      title: `${p.emoji} ${p.name} is overdue`,
      copy: `Save ${formatXAF(p.amount)} now to keep the pot on track. A ${Math.round(p.penaltyRate * 100)}% penalty (${formatXAF(penaltyFor(p))}) applies per missed cycle.`,
      href: `/wallet/savings/${p.id}`,
      cta: "Save now",
    });
  }
  if (dueToday[0]) {
    const p = dueToday[0];
    out.push({
      id: `due-${p.id}`,
      tone: "gold",
      kicker: `Due in ${timeUntil(p.nextDueAt)}`,
      title: `${p.emoji} ${p.name} needs ${formatXAF(p.amount)}`,
      copy: p.streak > 0 ? `You are on a ${p.streak}-cycle streak. Keep it alive before midnight.` : "Save before midnight to start your streak. Missing it costs " + formatXAF(penaltyFor(p)) + ".",
      href: `/wallet/savings/${p.id}`,
      cta: "Save now",
    });
  }
  if (!active.length) {
    out.push({
      id: "start-saving",
      tone: "brand",
      kicker: "Build a habit",
      title: "Put 500 XAF aside every day",
      copy: "That is 15,000 XAF a month, locked in a pot with a streak. Miss a day and a small penalty you choose keeps you honest.",
      href: "/wallet/savings?new=1",
      cta: "Start a pot",
      art: HABIT_ART,
    });
  }
  if (balance <= 0) {
    out.push({
      id: "fund",
      tone: "ink",
      kicker: "Empty wallet",
      title: "Add money to get going",
      copy: "Top up from MTN MoMo, Orange Money or a card in under a minute.",
      href: "/wallet/deposit",
      cta: "Add money",
    });
  }
  const pendingIn = transactions.filter((tx) => tx.status === "pending" && !isMoneyOut(tx.kind)).reduce((s, tx) => s + tx.amount, 0);
  if (pendingIn > 0) {
    out.push({
      id: "incoming",
      tone: "brand",
      kicker: "On the way",
      title: `${formatXAF(pendingIn)} incoming`,
      copy: "Money is being confirmed. It lands in your wallet as soon as the network settles.",
      href: "/wallet/history",
      cta: "Track",
    });
  }
  if (kyc === "unverified" && balance > 0) {
    out.push({
      id: "kyc",
      tone: "ink",
      kicker: "Lift your limits",
      title: "Verify your identity",
      copy: "Takes two minutes and unlocks higher daily limits.",
      href: "/wallet/kyc",
      cta: "Verify",
    });
  }
  if (contactsCount > 0 && balance > 0) {
    out.push({
      id: "send-again",
      tone: "brand",
      kicker: "People",
      title: "Send to someone you paid before",
      copy: `${contactsCount} ${contactsCount === 1 ? "person" : "people"} in your recent activity. Repeat a transfer in two taps.`,
      href: "/wallet/contacts",
      cta: "Pick a contact",
    });
  }
  if (FEATURES.international) {
    out.push({
      id: "abroad",
      tone: "ink",
      kicker: "New",
      title: "Send to Nigeria, Ghana, Senegal and more",
      copy: "Flat 2.5% fee, delivered to Mobile Money or bank in local currency.",
      href: "/wallet/international",
      cta: "Send abroad",
    });
  }
  return out;
}

const NUDGE_TONE: Record<Nudge["tone"], { card: string; kicker: string; cta: string }> = {
  brand: { card: "bg-brand-soft ring-brand/20", kicker: "text-brand-deep", cta: "bg-brand text-white hover:bg-brand-dark" },
  gold: { card: "bg-[#fff6d6] ring-gold/40", kicker: "text-[#7a5a00]", cta: "bg-ink text-white hover:bg-black" },
  danger: { card: "bg-red-50 ring-danger/20", kicker: "text-danger", cta: "bg-danger text-white hover:bg-red-700" },
  ink: { card: "bg-white ring-line/80", kicker: "text-muted", cta: "bg-ink text-white hover:bg-black" },
};

export function NextMove({ nudges }: { nudges: Nudge[] }) {
  const [primary, ...rest] = nudges;
  if (!primary) return null;
  const tone = NUDGE_TONE[primary.tone];
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-brand" />
        <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">Your next move</h2>
      </div>
      <Link
        href={primary.href}
        className={cn(
          "block overflow-hidden rounded-[1.5rem] ring-1 transition hover:-translate-y-0.5",
          tone.card,
          primary.art ? "p-0" : "p-4 sm:p-5",
        )}
      >
        {primary.art ? (
          <div className="grid sm:grid-cols-[1.15fr_0.85fr] sm:items-stretch">
            <div className="p-5 sm:p-6">
              <p className={cn("text-[11px] font-black uppercase tracking-[0.14em]", tone.kicker)}>{primary.kicker}</p>
              <p className="mt-1 text-xl font-black leading-tight text-ink sm:text-2xl">{primary.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/75">{primary.copy}</p>
              <span className={cn("mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold", tone.cta)}>
                {primary.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <div className="relative min-h-[10.5rem] bg-white/40 sm:min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primary.art}
                alt=""
                className="absolute inset-0 h-full w-full object-contain object-bottom p-2 sm:object-center sm:p-3"
              />
            </div>
          </div>
        ) : (
          <>
            <p className={cn("text-[11px] font-black uppercase tracking-[0.14em]", tone.kicker)}>{primary.kicker}</p>
            <p className="mt-1 text-lg font-black leading-tight text-ink">{primary.title}</p>
            <p className="mt-1 text-sm text-ink/75">{primary.copy}</p>
            <span className={cn("mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold", tone.cta)}>
              {primary.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </>
        )}
      </Link>
      {rest.slice(0, 2).length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {rest.slice(0, 2).map((n) => (
            <Link key={n.id} href={n.href} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line/80 hover:bg-paper">
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[10px] font-black uppercase tracking-[0.14em]", NUDGE_TONE[n.tone].kicker)}>{n.kicker}</span>
                <span className="block truncate text-sm font-bold text-ink">{n.title}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Week pulse ---------- */

