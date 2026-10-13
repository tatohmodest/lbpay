"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  PiggyBank,
  Plus,
  QrCode,
  Send,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useHiddenAmount } from "@/components/house-card";
import { isMoneyOut } from "@/lib/format";
import { kindTitle, txHref } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("fr-FR");

function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Douala" }).format(now));
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/* Balance hero                                                        */
/* ------------------------------------------------------------------ */

export function BalanceHero({
  name,
  balance,
  saved,
  today,
}: {
  name: string;
  balance: number;
  saved: number;
  today: number;
}) {
  const { hidden, toggle } = useHiddenAmount();
  const first = name.trim().split(/\s+/)[0] || "there";
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-white shadow-[0_30px_60px_-30px_rgba(6,38,28,0.6)] sm:p-7">
      <div className="lb-glow pointer-events-none absolute inset-0" />
      <div className="lb-grid-bg pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="text-[15px] text-hero-muted" suppressHydrationWarning>
          {greeting()}, <span className="font-display text-[18px] italic text-white">{first}</span>
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-hero-muted">Wallet balance</p>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/15"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {hidden ? "Show" : "Hide"}
          </button>
        </div>
        <p className="tabular mt-1 font-mono text-[2.6rem] font-black leading-none tracking-tight sm:text-5xl">
          {hidden ? "••••••" : fmt(balance)} <span className="text-lg font-bold text-hero-muted">XAF</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
          {today !== 0 ? (
            <span
              className={cn(
                "tabular rounded-full px-2.5 py-1",
                today > 0 ? "bg-brand/20 text-[#9fe8c4]" : "bg-white/10 text-white/75",
              )}
            >
              {today > 0 ? "+" : "−"}
              {hidden ? "•••" : fmt(Math.abs(today))} today
            </span>
          ) : null}
          <Link
            href="/wallet/savings"
            className="tabular inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/80 ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <PiggyBank className="h-3.5 w-3.5 text-gold" /> {hidden ? "•••" : fmt(saved)} in pots
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link
            href="/wallet/deposit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-forest transition hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> Add money
          </Link>
          <Link
            href="/wallet/send"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(0,179,105,0.9)] transition hover:bg-brand-dark"
          >
            <Send className="h-4 w-4" /> Send
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const ACTIONS = [
  { href: "/wallet/qr", label: "Receive", icon: ArrowDownLeft },
  { href: "/wallet/withdraw", label: "Withdraw", icon: ArrowUpRight },
  { href: "/wallet/quick", label: "Transfer", icon: ArrowLeftRight },
  { href: "/wallet/savings", label: "Save", icon: PiggyBank },
] as const;

export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-4 gap-2">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="group flex flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3.5 ring-1 ring-line/80 transition hover:-translate-y-0.5 hover:ring-brand/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-deep transition group-hover:bg-brand group-hover:text-white">
            <a.icon className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-semibold text-ink">{a.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

function dayLabel(iso: string, now = new Date()) {
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(d);
  const d = new Date(iso);
  if (fmtDay(d) === fmtDay(now)) return "Today";
  if (fmtDay(d) === fmtDay(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Douala" }).format(d);
}

function txIcon(tx: Transaction) {
  if (tx.kind === "savings_in" || tx.kind === "savings_out") return PiggyBank;
  if (tx.kind === "penalty") return ShieldAlert;
  if (tx.kind === "deposit") return Plus;
  if (tx.kind === "collection") return Wallet;
  return isMoneyOut(tx.kind) ? ArrowUpRight : ArrowDownLeft;
}

export function ActivityList({
  transactions,
  limit = 8,
  empty,
}: {
  transactions: Transaction[];
  limit?: number;
  empty?: React.ReactNode;
}) {
  const rows = transactions.slice(0, limit);
  if (!rows.length) return <>{empty}</>;
  const groups: Array<{ label: string; items: Transaction[] }> = [];
  for (const tx of rows) {
    const label = dayLabel(tx.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(tx);
    else groups.push({ label, items: [tx] });
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-1 text-[12px] font-semibold text-muted" suppressHydrationWarning>
            {g.label}
          </p>
          <ul className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-line/80">
            {g.items.map((tx, i) => {
              const out = isMoneyOut(tx.kind);
              const Icon = txIcon(tx);
              const pending = tx.status === "pending";
              const failed = tx.status === "failed" || tx.status === "cancelled" || tx.status === "expired";
              return (
                <li key={tx.id} className={i ? "border-t border-line" : ""}>
                  <Link href={txHref(tx.id)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper/70">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        tx.kind === "penalty"
                          ? "bg-[#fdecea] text-danger"
                          : out
                            ? "bg-paper text-ink ring-1 ring-line"
                            : "bg-brand-soft text-brand-deep",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-ink">{tx.counterparty || kindTitle(tx.kind)}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {kindTitle(tx.kind)}
                        {pending ? " · Pending" : failed ? " · Didn't go through" : ""}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "tabular shrink-0 text-[14px] font-bold",
                        failed ? "text-muted line-through" : out ? "text-ink" : "text-brand-deep",
                      )}
                    >
                      {out ? "−" : "+"}
                      {fmt(tx.amount)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section head                                                        */
/* ------------------------------------------------------------------ */

export function DashSection({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {href ? (
          <Link href={href} className="text-[13px] font-semibold text-brand-deep hover:underline">
            {action || "See all"}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DashEmpty({
  icon: Icon = QrCode,
  title,
  copy,
  href,
  cta,
}: {
  icon?: typeof QrCode;
  title: string;
  copy: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-dashed border-line bg-white px-6 py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-[15px] font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{copy}</p>
      <Link
        href={href}
        className="mt-4 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[13px] font-semibold text-white transition hover:bg-ink/90"
      >
        {cta}
      </Link>
    </div>
  );
}
