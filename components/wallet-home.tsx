"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { FEATURES } from "@/lib/flags";
import { formatXAF, isMoneyOut } from "@/lib/format";
import { dueState, penaltyFor, timeUntil } from "@/lib/savings";
import type { SavingsPlan, Transaction } from "@/lib/types";
import { HABIT_ART } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { useL } from "@/lib/i18n/use-i18n";


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
  L = (en) => en,
}: {
  balance: number;
  plans: SavingsPlan[];
  transactions: Transaction[];
  contactsCount: number;
  kyc: string;
  /** Inline bilingual text; English when omitted. */
  L?: (en: string, fr: string) => string;
}): Nudge[] {
  const when = (iso: string) => {
    const t = timeUntil(iso);
    return L(t, t.replace("now", "maintenant").replace(" days", " jours"));
  };
  const out: Nudge[] = [];
  const active = plans.filter((p) => p.status === "active");
  const overdue = active.filter((p) => dueState(p) === "overdue").sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));
  const dueToday = active.filter((p) => dueState(p) === "today").sort((a, b) => +new Date(a.nextDueAt) - +new Date(b.nextDueAt));

  if (overdue[0]) {
    const p = overdue[0];
    out.push({
      id: `overdue-${p.id}`,
      tone: "danger",
      kicker: L("Missed save", "Épargne manquée"),
      title: L(`${p.emoji} ${p.name} is overdue`, `${p.emoji} ${p.name} est en retard`),
      copy: L(
        `Save ${formatXAF(p.amount)} now to keep the pot on track. A ${Math.round(p.penaltyRate * 100)}% penalty (${formatXAF(penaltyFor(p))}) applies per missed cycle.`,
        `Épargnez ${formatXAF(p.amount)} maintenant pour rester dans les temps. Une pénalité de ${Math.round(p.penaltyRate * 100)} % (${formatXAF(penaltyFor(p))}) s'applique par échéance manquée.`,
      ),
      href: `/wallet/savings/${p.id}`,
      cta: L("Save now", "Épargner"),
    });
  }
  if (dueToday[0]) {
    const p = dueToday[0];
    out.push({
      id: `due-${p.id}`,
      tone: "gold",
      kicker: L(`Due in ${when(p.nextDueAt)}`, `À verser dans ${when(p.nextDueAt)}`),
      title: L(`${p.emoji} ${p.name} needs ${formatXAF(p.amount)}`, `${p.emoji} ${p.name} attend ${formatXAF(p.amount)}`),
      copy:
        p.streak > 0
          ? L(
              `You are on a ${p.streak}-cycle streak. Keep it alive before midnight.`,
              `Vous êtes sur une série de ${p.streak}. Gardez-la avant minuit.`,
            )
          : L(
              `Save before midnight to start your streak. Missing it costs ${formatXAF(penaltyFor(p))}.`,
              `Épargnez avant minuit pour lancer votre série. La manquer coûte ${formatXAF(penaltyFor(p))}.`,
            ),
      href: `/wallet/savings/${p.id}`,
      cta: L("Save now", "Épargner"),
    });
  }
  if (!active.length) {
    out.push({
      id: "start-saving",
      tone: "brand",
      kicker: L("Build a habit", "Prenez l'habitude"),
      title: L("Put 500 XAF aside every day", "Mettez 500 XAF de côté chaque jour"),
      copy: L(
        "That is 15,000 XAF a month, locked in a pot with a streak. Miss a day and a small penalty you choose keeps you honest.",
        "Cela fait 15 000 XAF par mois, dans une cagnotte avec une série. Un jour manqué, et une petite pénalité que vous choisissez vous garde motivé.",
      ),
      href: "/wallet/savings?new=1",
      cta: L("Start a pot", "Créer une cagnotte"),
      art: HABIT_ART,
    });
  }
  if (balance <= 0) {
    out.push({
      id: "fund",
      tone: "ink",
      kicker: L("Empty wallet", "Portefeuille vide"),
      title: L("Add money to get going", "Ajoutez de l'argent pour commencer"),
      copy: L("Top up from MTN MoMo or Orange Money in under a minute.", "Rechargez depuis MTN MoMo ou Orange Money en moins d'une minute."),
      href: "/wallet/deposit",
      cta: L("Add money", "Ajouter"),
    });
  }
  const pendingIn = transactions.filter((tx) => tx.status === "pending" && !isMoneyOut(tx.kind)).reduce((s, tx) => s + tx.amount, 0);
  if (pendingIn > 0) {
    out.push({
      id: "incoming",
      tone: "brand",
      kicker: L("On the way", "En route"),
      title: L(`${formatXAF(pendingIn)} incoming`, `${formatXAF(pendingIn)} en approche`),
      copy: L("Money is being confirmed. It lands in your wallet as soon as the network settles.", "L'argent est en cours de confirmation. Il arrive dès que le réseau valide."),
      href: "/wallet/history",
      cta: L("Track", "Suivre"),
    });
  }
  if (kyc === "unverified" && balance > 0) {
    out.push({
      id: "kyc",
      tone: "ink",
      kicker: L("Lift your limits", "Augmentez vos plafonds"),
      title: L("Verify your identity", "Vérifiez votre identité"),
      copy: L("Takes two minutes and unlocks higher daily limits.", "Deux minutes suffisent pour débloquer des plafonds plus élevés."),
      href: "/wallet/kyc",
      cta: L("Verify", "Vérifier"),
    });
  }
  if (contactsCount > 0 && balance > 0) {
    out.push({
      id: "send-again",
      tone: "brand",
      kicker: L("People", "Contacts"),
      title: L("Send to someone you paid before", "Envoyez à quelqu'un que vous avez déjà payé"),
      copy: L(
        `${contactsCount} ${contactsCount === 1 ? "person" : "people"} in your recent activity. Repeat a transfer in two taps.`,
        `${contactsCount} ${contactsCount === 1 ? "personne" : "personnes"} dans votre activité récente. Refaites un envoi en deux gestes.`,
      ),
      href: "/wallet/contacts",
      cta: L("Pick a contact", "Choisir un contact"),
    });
  }
  if (FEATURES.international) {
    out.push({
      id: "abroad",
      tone: "ink",
      kicker: L("New", "Nouveau"),
      title: L("Send to Nigeria, Ghana, Senegal and more", "Envoyez au Nigeria, au Ghana, au Sénégal et plus"),
      copy: L("Flat 2.5% fee, delivered to Mobile Money or bank in local currency.", "Frais fixes de 2,5 %, livré sur Mobile Money ou en banque, en monnaie locale."),
      href: "/wallet/international",
      cta: L("Send abroad", "Envoyer"),
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
  const L = useL();
  const [primary, ...rest] = nudges;
  if (!primary) return null;
  const tone = NUDGE_TONE[primary.tone];
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-brand" />
        <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">{L("Your next move", "Votre prochaine étape")}</h2>
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

