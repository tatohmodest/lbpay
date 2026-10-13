"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, Link2, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { PayQR } from "@/components/qr";
import { AppImg } from "@/components/app-img";
import { CopyHandle } from "@/components/copy-handle";
import { ShareRow } from "@/components/share-row";
import { useL } from "@/lib/i18n/use-i18n";

/** The "pay me" card and guidance. Pure presentation: the page passes in the data. */
export function ReceiveView({
  handle,
  name,
  avatar,
  verified,
  payUrl,
}: {
  handle: string;
  name: string;
  avatar?: string;
  verified: boolean;
  payUrl: string;
}) {
  const L = useL();
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 overflow-x-hidden lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:space-y-0 lg:overflow-visible">
      <div className="min-w-0 space-y-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/wallet"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line/80 transition hover:ring-brand/40"
            aria-label={L("Back", "Retour")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[1.5rem] font-black leading-tight tracking-tight text-ink sm:text-[1.75rem]">{L("Receive money", "Recevoir de l'argent")}</h1>
            <p className="text-[14px] text-muted">{L("Show it, scan it, or share it.", "Montrez-le, scannez-le ou partagez-le.")}</p>
          </div>
        </div>

        {/* The pay-me card */}
        <section className="relative overflow-hidden rounded-[2rem] bg-forest p-5 text-center text-white shadow-[0_30px_60px_-30px_rgba(6,38,28,0.6)] sm:p-6">
          <div className="lb-glow pointer-events-none absolute inset-0" />
          <div className="lb-grid-bg pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="mx-auto flex max-w-full min-w-0 items-center justify-center gap-3">
              <AppImg src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-white/20" />
              <div className="min-w-0 text-left leading-tight">
                <p className="truncate text-[16px] font-bold">{name}</p>
                <p className="flex items-center gap-1 text-[12px] text-hero-muted">
                  {verified ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-brand" /> {L("Verified on LBPay", "Vérifié sur LBPay")}
                    </>
                  ) : (
                    L("On LBPay", "Sur LBPay")
                  )}
                </p>
              </div>
            </div>

            <div className="lb-rise mx-auto mt-6 w-full max-w-[240px] rounded-[1.75rem] bg-white p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] sm:p-4 [&_svg]:h-auto [&_svg]:w-full">
              {payUrl ? (
                <PayQR value={payUrl} size={208} padded={false} />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-xl bg-paper" />
              )}
            </div>

            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-hero-muted">{L("Pay me at", "Payez-moi à")}</p>
            <CopyHandle
              handle={handle}
              className="mx-auto mt-1 justify-center font-display text-[clamp(1.5rem,8vw,2.25rem)] italic leading-tight text-white hover:text-white/80"
            />
            <p className="mt-2 text-[13px] text-hero-muted">{L("Scan with any phone camera", "Scannez avec l'appareil photo de n'importe quel téléphone")}</p>
          </div>
        </section>

        <ShareRow
          url={payUrl}
          text={L(
            `Pay ${name} on LBPay (@${handle}). MTN MoMo, Orange Money or LBPay wallet.`,
            `Payez ${name} sur LBPay (@${handle}). MTN MoMo, Orange Money ou portefeuille LBPay.`,
          )}
          copyLabel={L("Copy my pay link", "Copier mon lien de paiement")}
        />
      </div>

      {/* How it works + request */}
      <div className="min-w-0 space-y-5">
        <Link
          href="/wallet/request"
          className="group flex items-center gap-3 rounded-[1.75rem] bg-white p-4 ring-1 sm:gap-4 sm:p-5 ring-line/80 transition hover:-translate-y-0.5 hover:ring-brand/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
            <ArrowDownLeft className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold text-ink">{L("Ask for a set amount", "Demander un montant précis")}</span>
            <span className="block text-[13px] text-muted">{L("Make a request link with the amount filled in.", "Créez un lien de demande avec le montant déjà rempli.")}</span>
          </span>
          <span className="shrink-0 text-[13px] font-bold text-brand-deep transition group-hover:translate-x-0.5">
            <span className="hidden sm:inline">{L("Create ", "Créer ")}</span>→
          </span>
        </Link>

        <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80">
          <h2 className="text-[16px] font-bold text-ink">{L("How people can pay you", "Comment on peut vous payer")}</h2>
          <ul className="mt-4 space-y-4">
            {[
              {
                icon: Wallet,
                title: L("From an LBPay wallet", "Depuis un portefeuille LBPay"),
                copy: L(`They send to @${handle}. Instant and free for both of you.`, `Ils envoient à @${handle}. Instantané et gratuit pour vous deux.`),
              },
              {
                icon: Smartphone,
                title: L("From MTN MoMo or Orange Money", "Depuis MTN MoMo ou Orange Money"),
                copy: L("They open your link or scan your QR and approve on their phone. No app needed.", "Ils ouvrent votre lien ou scannent votre QR et valident sur leur téléphone. Sans application."),
              },
              {
                icon: Link2,
                title: L("From anywhere you share", "Partout où vous partagez"),
                copy: L("Put your link in your WhatsApp status, Instagram bio or shop window.", "Mettez votre lien dans votre statut WhatsApp, votre bio Instagram ou votre vitrine."),
              },
            ].map((row) => (
              <li key={row.title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-ink ring-1 ring-line">
                  <row.icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-ink">{row.title}</span>
                  <span className="block text-[13px] leading-5 text-muted">{row.copy}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex items-start gap-2 px-1 text-[12px] leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          {L("Your phone number is never shown to people who pay you. They only see your name and @handle.", "Votre numéro n'est jamais montré à ceux qui vous paient. Ils voient seulement votre nom et votre @identifiant.")}
        </p>
      </div>
    </div>
  );
}
