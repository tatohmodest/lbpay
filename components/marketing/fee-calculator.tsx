"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Users } from "lucide-react";
import { FEE_RATES, depositFee, directTransferFee, feePercent, momoOutFee } from "@/lib/fees";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/cn";
import { useL } from "@/lib/i18n/use-i18n";

const fmt = (n: number) => n.toLocaleString("fr-FR");

type Lx = (en: string, fr: string) => string;

function buildKinds(L: Lx) {
  return [
    {
      id: "wallet",
      label: L("Wallet to wallet", "Portefeuille à portefeuille"),
      icon: Users,
      rate: FEE_RATES.walletTransfer,
      fee: () => 0,
      receiveLabel: L("They receive", "Ils reçoivent"),
      note: L("Instant, to any @handle or LBPay number. Always free.", "Instantané, vers tout @identifiant ou numéro LBPay. Toujours gratuit."),
    },
    {
      id: "withdraw",
      label: L("To MoMo", "Vers MoMo"),
      icon: ArrowUpRight,
      rate: FEE_RATES.withdraw,
      fee: momoOutFee,
      receiveLabel: L("Lands on MTN or Orange", "Arrive sur MTN ou Orange"),
      note: L(
        `From your wallet to any MTN or Orange number. ${LIMITS.momoOutMin.toLocaleString("fr-FR")} to ${LIMITS.momoOutMax.toLocaleString("fr-FR")} XAF per transfer.`,
        `De votre portefeuille vers tout numéro MTN ou Orange. De ${LIMITS.momoOutMin.toLocaleString("fr-FR")} à ${LIMITS.momoOutMax.toLocaleString("fr-FR")} XAF par envoi.`,
      ),
    },
    {
      id: "deposit",
      label: L("Add money", "Recharger"),
      icon: ArrowDownLeft,
      rate: FEE_RATES.deposit,
      fee: depositFee,
      receiveLabel: L("Added to your wallet", "Ajouté à votre portefeuille"),
      note: L("Top up from MTN MoMo or Orange Money. Approve on your phone.", "Rechargez depuis MTN MoMo ou Orange Money. Validez sur votre téléphone."),
    },
    {
      id: "cross",
      label: "MTN ↔ Orange",
      icon: ArrowLeftRight,
      rate: FEE_RATES.crossNetwork,
      fee: (n: number) => directTransferFee(n, "mtn", "orange"),
      receiveLabel: L("They receive", "Ils reçoivent"),
      note: L("Quick transfer between networks, no wallet balance needed.", "Transfert rapide entre réseaux, sans solde de portefeuille."),
    },
  ] as const;
}

export function FeeCalculator({ className }: { className?: string }) {
  const L = useL();
  const kinds = buildKinds(L);
  const [kind, setKind] = useState<ReturnType<typeof buildKinds>[number]["id"]>("withdraw");
  const [raw, setRaw] = useState("50000");
  const active = kinds.find((k) => k.id === kind)!;
  const amount = Math.min(Number(raw.replace(/\D/g, "")) || 0, 10_000_000);
  const fee = active.fee(amount);
  const total = amount + fee;

  return (
    <div className={cn("rounded-[1.75rem] bg-white p-2 shadow-[0_30px_60px_-30px_rgba(6,38,28,0.25)] ring-1 ring-line", className)}>
      <div role="tablist" aria-label={L("Transfer type", "Type de transfert")} className="grid grid-cols-2 gap-1 rounded-[1.4rem] bg-paper p-1">
        {kinds.map((k) => (
          <button
            key={k.id}
            role="tab"
            type="button"
            aria-selected={kind === k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[1.1rem] px-2 py-2.5 text-[13px] font-semibold transition",
              kind === k.id ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            <k.icon className="h-3.5 w-3.5" />
            {k.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-7">
        <label htmlFor="fee-amount" className="text-[13px] font-medium text-muted">
          {L("Amount", "Montant")}
        </label>
        <div className="mt-2 flex items-baseline gap-2 border-b-2 border-line pb-2 focus-within:border-brand">
          <input
            id="fee-amount"
            value={amount ? fmt(amount) : ""}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="tabular w-full min-w-0 bg-transparent text-[2.5rem] font-bold tracking-tight text-ink outline-none placeholder:text-line md:text-5xl"
          />
          <span className="text-lg font-semibold text-muted">XAF</span>
        </div>

        <dl className="mt-6 space-y-3 text-[15px]">
          <div className="flex items-center justify-between">
            <dt className="text-muted">
              {L("Fee", "Frais")} <span className="tabular">({feePercent(active.rate)}%)</span>
            </dt>
            <dd className={cn("tabular font-semibold", fee === 0 ? "text-brand-deep" : "text-ink")}>
              {fee === 0 ? L("Free", "Gratuit") : `${fmt(fee)} XAF`}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">{active.receiveLabel}</dt>
            <dd className="tabular font-semibold text-ink">{fmt(amount)} XAF</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <dt className="font-semibold text-ink">{L("You pay in total", "Vous payez au total")}</dt>
            <dd className="tabular text-xl font-bold text-ink">{fmt(total)} XAF</dd>
          </div>
        </dl>
        <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-[13px] leading-6 text-muted">
          {active.note}{" "}
          {L("The fee is shown before you enter your PIN. Nothing is hidden in the rate.", "Les frais sont affichés avant votre PIN. Rien n'est caché dans le taux.")}
        </p>
      </div>
    </div>
  );
}
