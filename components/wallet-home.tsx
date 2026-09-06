"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Eye, EyeOff, Flame, PiggyBank, Sparkles } from "lucide-react";
import { PayQR } from "@/components/qr";
import { COUNTRIES } from "@/lib/countries";
import { copyText } from "@/lib/clipboard";
import { FEATURES, INTERNATIONAL_OPENS } from "@/lib/flags";
import { formatXAF, isMoneyOut } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { dueState, penaltyFor, timeUntil } from "@/lib/savings";
import type { SavingsPlan, Transaction } from "@/lib/types";
import { useHiddenAmount } from "@/components/house-card";
import { cn } from "@/lib/cn";

/* ---------- Balance ---------- */

export function WalletBalance({
  amount,
  saved,
  delta,
  payUrl,
}: {
  amount: number;
  saved: number;
  delta: number;
  payUrl?: string;
}) {
  const { hidden, toggle } = useHiddenAmount();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  const mask = (n: number) => (hidden ? "*****" : formatXAF(n, { withCurrency: false }));

  async function copyPayLink() {
    if (!payUrl) return;
    try {
      await copyText(payUrl);
      setCopied(true);
      notify.success("Copied", "Share this payment link so people can pay you.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      notify.error("Could not copy", "Open QR and copy the link from there.");
    }
  }

  return (
    <div className="space-y-2.5">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(12,25,19,0.08)] ring-1 ring-black/[0.06]">
        <div className="pointer-events-none absolute bottom-0 right-0 h-[4.75rem] w-[8.5rem] overflow-hidden" aria-hidden>
          <div className="absolute -bottom-9 -right-8 flex h-28 w-40 origin-bottom-right -rotate-[28deg]">
            <span className="w-[11px] bg-[#00b369]" />
            <span className="w-[11px] bg-[#ffcc00]" />
            <span className="w-[11px] bg-[#ff6a00]" />
            <span className="w-[11px] bg-[#7b3ff2]" />
            <span className="w-[11px] bg-[#e11d48]" />
          </div>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Image src="/illustrations/lbpay-mark.webp" alt="" width={20} height={20} className="h-5 w-5 rounded-[5px]" />
              Main wallet
            </p>
            <p className="mt-3 font-mono text-[1.7rem] font-black leading-none tracking-tight text-ink sm:text-[1.85rem]">
              {mask(amount)} <span className="text-[15px] font-bold text-ink">XAF</span>
            </p>
            <button
              type="button"
              onClick={toggle}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full border border-ink bg-white px-3 text-[12px] font-semibold text-ink"
            >
              {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hidden ? "Show balance" : "Hide balance"}
            </button>
          </div>
          {payUrl ? (
            <button
              type="button"
              onClick={() => void copyPayLink()}
              className="relative z-10 shrink-0 rounded-[0.7rem] bg-white p-1.5 ring-1 ring-line"
              aria-label={copied ? "Payment link copied" : "Copy payment link"}
              title="Tap to copy your payment link"
            >
              <PayQR value={payUrl} size={122} padded={false} />
              <span className="sr-only">{copied ? "Copied" : "Tap to copy payment link"}</span>
            </button>
          ) : (
            <div className="relative z-10 h-[134px] w-[134px] shrink-0 rounded-[0.7rem] bg-paper ring-1 ring-line" />
          )}
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-2 px-0.5 text-[12px] font-semibold">
        <span
          className={cn(
            "rounded-full px-2.5 py-1",
            delta > 0 ? "bg-brand-soft text-brand-deep" : "bg-white text-muted ring-1 ring-line/80",
          )}
        >
          Today {hidden ? "••••" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatXAF(Math.abs(delta), { withCurrency: false })}`}
        </span>
        <Link href="/wallet/savings" className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-muted ring-1 ring-line/80 hover:text-ink">
          <PiggyBank className="h-3.5 w-3.5" /> Saved {mask(saved)}
        </Link>
      </div>
    </div>
  );
}

/* ---------- Action grid ---------- */

export type ActionTile = { href: string; label: string; art: string; badge?: string };

export function ActionGrid({ items }: { items: ActionTile[] }) {
  return (
    <nav className="grid grid-cols-4 gap-2" aria-label="Quick actions">
      {items.map((item) => {
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-col items-center gap-1 rounded-2xl bg-white px-1 py-2.5 text-center ring-1 ring-line/80 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(12,25,19,0.08)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.art}
              alt=""
              width={56}
              height={56}
              draggable={false}
              className="h-14 w-14 object-contain transition group-hover:scale-105"
            />
            <span className="text-[11.5px] font-bold text-ink">{item.label}</span>
            {item.badge ? (
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-ink">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------- Next move (nudges) ---------- */

export type Nudge = {
  id: string;
  tone: "brand" | "gold" | "danger" | "ink";
  kicker: string;
  title: string;
  copy: string;
  href: string;
  cta: string;
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
      <Link href={primary.href} className={cn("block rounded-[1.5rem] p-4 ring-1 transition hover:-translate-y-0.5 sm:p-5", tone.card)}>
        <p className={cn("text-[11px] font-black uppercase tracking-[0.14em]", tone.kicker)}>{primary.kicker}</p>
        <p className="mt-1 text-lg font-black leading-tight text-ink">{primary.title}</p>
        <p className="mt-1 text-sm text-ink/75">{primary.copy}</p>
        <span className={cn("mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold", tone.cta)}>
          {primary.cta} <ArrowRight className="h-4 w-4" />
        </span>
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

export function weekSeries(transactions: Transaction[], now = new Date()) {
  const days: Array<{ label: string; in: number; out: number; saved: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ label: d.toLocaleDateString("en", { weekday: "narrow" }), in: 0, out: 0, saved: 0 });
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  for (const tx of transactions) {
    if (tx.status !== "success") continue;
    const at = new Date(tx.createdAt).getTime();
    if (at < start) continue;
    const idx = Math.min(6, Math.floor((at - start) / 86_400_000));
    if (idx < 0) continue;
    if (tx.kind === "savings_in") days[idx].saved += tx.amount;
    else if (isMoneyOut(tx.kind)) days[idx].out += tx.amount;
    else days[idx].in += tx.amount;
  }
  return days;
}

export function WeekPulse({ transactions, streak }: { transactions: Transaction[]; streak: number }) {
  const series = weekSeries(transactions);
  const totals = series.reduce((acc, d) => ({ in: acc.in + d.in, out: acc.out + d.out, saved: acc.saved + d.saved }), { in: 0, out: 0, saved: 0 });
  const max = Math.max(1, ...series.map((d) => Math.max(d.in, d.out + d.saved)));
  const { hidden } = useHiddenAmount();
  const mask = (n: number) => (hidden ? "••••" : formatXAF(n, { withCurrency: false }));
  const quiet = totals.in + totals.out + totals.saved === 0;

  return (
    <section className="rounded-[1.5rem] bg-white p-4 ring-1 ring-line/80 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">Last 7 days</h2>
        {streak > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1e6] px-2.5 py-1 text-[11px] font-black text-[#b4530a]">
            <Flame className="h-3.5 w-3.5" /> {streak}-cycle streak
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "In", value: totals.in, tone: "text-brand-deep", dot: "bg-brand" },
          { label: "Out", value: totals.out, tone: "text-ink", dot: "bg-ink/70" },
          { label: "Saved", value: totals.saved, tone: "text-[#b4530a]", dot: "bg-gold" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-paper px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
              <span className={cn("h-2 w-2 rounded-full", k.dot)} /> {k.label}
            </p>
            <p className={cn("mt-0.5 truncate font-mono text-[15px] font-black tabular-nums", k.tone)}>{mask(k.value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid h-24 grid-cols-7 items-end gap-2" aria-hidden>
        {series.map((d, i) => (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              <span className="w-1/2 rounded-t-md bg-brand/80" style={{ height: `${Math.max(d.in ? 6 : 2, (d.in / max) * 100)}%` }} />
              <span className="flex w-1/2 flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${Math.max(d.out + d.saved ? 6 : 2, ((d.out + d.saved) / max) * 100)}%` }}>
                <span className="w-full bg-gold" style={{ flexGrow: d.saved, minHeight: d.saved ? 3 : 0 }} />
                <span className="w-full bg-ink/60" style={{ flexGrow: d.out, minHeight: d.out ? 3 : 0 }} />
              </span>
            </div>
            <span className="text-[10px] font-semibold text-muted">{d.label}</span>
          </div>
        ))}
      </div>
      {quiet ? <p className="mt-2 text-center text-xs text-muted">A quiet week. Start a pot or send to someone to see it move.</p> : null}
    </section>
  );
}

/* ---------- Explore cards ---------- */

export function AbroadCard() {
  return (
    <Link href="/wallet/international" className="group relative block overflow-hidden rounded-[1.5rem] bg-forest p-5 text-white ring-1 ring-forest transition hover:-translate-y-0.5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand">Across Africa</p>
      <p className="mt-1 text-lg font-black leading-tight">Send to 9 countries at a flat 2.5%.</p>
      <p className="mt-1 text-sm text-hero-muted">Naira, cedi, CFA — delivered to Mobile Money or bank.</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {COUNTRIES.filter((c) => c.code !== "CM").map((c) => (
          <span key={c.code} className="rounded-full bg-white/10 px-2 py-0.5 text-sm" title={c.name}>
            {c.flag}
          </span>
        ))}
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
        {FEATURES.international ? (
          <>
            Send abroad <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </>
        ) : (
          <>Coming {INTERNATIONAL_OPENS}</>
        )}
      </span>
    </Link>
  );
}

export function SectionHead({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">{title}</h2>
      {href ? (
        <Link href={href} className="text-[12px] font-bold text-brand-deep hover:underline">
          {action || "See all"}
        </Link>
      ) : null}
    </div>
  );
}
