"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
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
import { ACTION_ART } from "@/lib/assets";
import { isMoneyOut } from "@/lib/format";
import { kindTitle, txHref } from "@/lib/tx";
import { cn } from "@/lib/cn";
import { useL } from "@/lib/i18n/use-i18n";
import type { Transaction } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("fr-FR");

function greeting(L: (en: string, fr: string) => string, now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Douala" }).format(now));
  if (h < 12) return L("Good morning", "Bonjour");
  if (h < 18) return L("Good afternoon", "Bon après-midi");
  return L("Good evening", "Bonsoir");
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
  const L = useL();
  const first = name.trim().split(/\s+/)[0] || "there";
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-white shadow-[0_30px_60px_-30px_rgba(6,38,28,0.6)] sm:p-7">
      <div className="lb-glow pointer-events-none absolute inset-0" />
      <div className="lb-grid-bg pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="text-[15px] text-hero-muted" suppressHydrationWarning>
          {greeting(L)}, <span className="font-display text-[18px] italic text-white">{first}</span>
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-hero-muted">{L("Wallet balance", "Solde du portefeuille")}</p>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/15"
            aria-label={hidden ? L("Show balance", "Afficher le solde") : L("Hide balance", "Masquer le solde")}
          >
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {hidden ? L("Show", "Afficher") : L("Hide", "Masquer")}
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
              {hidden ? "•••" : fmt(Math.abs(today))} {L("today", "aujourd'hui")}
            </span>
          ) : null}
          <Link
            href="/wallet/savings"
            className="tabular inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/80 ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <PiggyBank className="h-3.5 w-3.5 text-gold" /> {hidden ? "•••" : fmt(saved)} {L("in pots", "en cagnottes")}
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link
            href="/wallet/deposit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-forest transition hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> {L("Add money", "Ajouter")}
          </Link>
          <Link
            href="/wallet/send"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(0,179,105,0.9)] transition hover:bg-brand-dark"
          >
            <Send className="h-4 w-4" /> {L("Send", "Envoyer")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/** LBPay's own 3D action art: the brand's icon language. Keep it; don't swap for library icons. */
const ACTIONS = [
  { href: "/wallet/send", label: "Send", art: ACTION_ART.send },
  { href: "/wallet/savings", label: "Save", art: ACTION_ART.save, badge: "New" },
  { href: "/wallet/international", label: "Abroad", art: ACTION_ART.abroad, badge: "Soon" },
  { href: "/wallet/qr", label: "Receive", art: ACTION_ART.receive },
  { href: "/wallet/deposit", label: "Deposit", art: ACTION_ART.deposit },
  { href: "/wallet/withdraw", label: "Withdraw", art: ACTION_ART.withdraw },
  { href: "/wallet/quick", label: "Quick", art: ACTION_ART.quick },
  { href: "/wallet/qr", label: "QR", art: ACTION_ART.qr },
] as const;

const ACTION_FR: Record<string, string> = {
  Send: "Envoyer",
  Save: "Épargner",
  Abroad: "Étranger",
  Receive: "Recevoir",
  Deposit: "Recharger",
  Withdraw: "Retirer",
  Quick: "Rapide",
  QR: "QR",
  New: "Nouveau",
  Soon: "Bientôt",
};

export function QuickActions() {
  const L = useL();
  return (
    <nav aria-label={L("Quick actions", "Actions rapides")} className="grid grid-cols-4 gap-2.5">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group relative flex flex-col items-center gap-1.5 rounded-[1.4rem] bg-white px-1 pb-3 pt-2.5 ring-1 ring-line/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(6,38,28,0.35)] hover:ring-brand/30 active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.art}
            alt=""
            width={56}
            height={56}
            draggable={false}
            className="h-14 w-14 object-contain transition duration-200 group-hover:scale-105"
          />
          <span className="text-[12px] font-semibold text-ink">{L(a.label, ACTION_FR[a.label] ?? a.label)}</span>
          {"badge" in a && a.badge ? (
            <span
              className={cn(
                "absolute -top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                a.badge === "Soon" ? "bg-paper text-muted ring-1 ring-line" : "bg-gold text-ink",
              )}
            >
              {L(a.badge, ACTION_FR[a.badge] ?? a.badge)}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

function dayLabel(iso: string, L: (en: string, fr: string) => string, now = new Date()) {
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(d);
  const d = new Date(iso);
  if (fmtDay(d) === fmtDay(now)) return L("Today", "Aujourd'hui");
  if (fmtDay(d) === fmtDay(new Date(now.getTime() - 86_400_000))) return L("Yesterday", "Hier");
  return new Intl.DateTimeFormat(L("en-GB", "fr-FR"), { day: "numeric", month: "short", timeZone: "Africa/Douala" }).format(d);
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
  const L = useL();
  const rows = transactions.slice(0, limit);
  if (!rows.length) return <>{empty}</>;
  const groups: Array<{ label: string; items: Transaction[] }> = [];
  for (const tx of rows) {
    const label = dayLabel(tx.createdAt, L);
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
                        {pending ? L(" · Pending", " · En attente") : failed ? L(" · Didn't go through", " · N'a pas abouti") : ""}
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
  const L = useL();
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {href ? (
          <Link href={href} className="text-[13px] font-semibold text-brand-deep hover:underline">
            {action || L("See all", "Tout voir")}
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
