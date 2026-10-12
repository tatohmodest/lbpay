"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, Link2, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { PayQR } from "@/components/qr";
import { AppImg } from "@/components/app-img";
import { CopyHandle } from "@/components/copy-handle";
import { ShareRow } from "@/components/share-row";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { payHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

/** Receive money: a "pay me" card people can scan, tap, or open from a shared link. */
export default function WalletQrPage() {
  const { state } = useApp();
  const me = useMe();
  const user = me.data?.user;
  const handle = user?.lbpayId || state.user.lbpayId;
  const name = user?.businessName || user?.name || state.user.name;
  const avatar = user?.avatar || state.user.avatar;
  const verified = user?.kyc?.personal === "verified";
  const origin = useBrowserOrigin();
  const payUrl = handle && origin ? payHandleUrl(handle, origin) : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6 lg:grid lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start lg:gap-10 lg:space-y-0">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line/80 transition hover:ring-brand/40"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-ink">Receive money</h1>
            <p className="text-[14px] text-muted">Show it, scan it, or share it.</p>
          </div>
        </div>

        {/* The pay-me card */}
        <section className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-center text-white shadow-[0_30px_60px_-30px_rgba(6,38,28,0.6)]">
          <div className="lb-glow pointer-events-none absolute inset-0" />
          <div className="lb-grid-bg pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="flex items-center justify-center gap-3">
              <AppImg src={avatar} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/20" />
              <div className="min-w-0 text-left leading-tight">
                <p className="truncate text-[16px] font-bold">{name}</p>
                <p className="flex items-center gap-1 text-[12px] text-hero-muted">
                  {verified ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Verified on LBPay
                    </>
                  ) : (
                    "On LBPay"
                  )}
                </p>
              </div>
            </div>

            <div className="lb-rise mx-auto mt-6 w-fit rounded-[1.75rem] bg-white p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
              {payUrl ? (
                <PayQR value={payUrl} size={208} padded={false} />
              ) : (
                <div className="h-[208px] w-[208px] animate-pulse rounded-xl bg-paper" />
              )}
            </div>

            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-hero-muted">Pay me at</p>
            <CopyHandle handle={handle} className="mt-1 font-display text-4xl italic text-white hover:text-white/80" />
            <p className="mt-2 text-[13px] text-hero-muted">Scan with any phone camera</p>
          </div>
        </section>

        <ShareRow
          url={payUrl}
          text={`Pay ${name} on LBPay (@${handle}). MTN MoMo, Orange Money or LBPay wallet.`}
          copyLabel="Copy my pay link"
        />
      </div>

      {/* How it works + request */}
      <div className="space-y-5">
        <Link
          href="/wallet/request"
          className="group flex items-center gap-4 rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80 transition hover:-translate-y-0.5 hover:ring-brand/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
            <ArrowDownLeft className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold text-ink">Ask for a set amount</span>
            <span className="block text-[13px] text-muted">Make a request link with the amount filled in.</span>
          </span>
          <span className="text-[13px] font-bold text-brand-deep transition group-hover:translate-x-0.5">Create →</span>
        </Link>

        <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80">
          <h2 className="text-[16px] font-bold text-ink">How people can pay you</h2>
          <ul className="mt-4 space-y-4">
            {[
              {
                icon: Wallet,
                title: "From an LBPay wallet",
                copy: `They send to @${handle}. Instant and free for both of you.`,
              },
              {
                icon: Smartphone,
                title: "From MTN MoMo or Orange Money",
                copy: "They open your link or scan your QR and approve on their phone. No app needed.",
              },
              {
                icon: Link2,
                title: "From anywhere you share",
                copy: "Put your link in your WhatsApp status, Instagram bio or shop window.",
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
          Your phone number is never shown to people who pay you. They only see your name and @handle.
        </p>
      </div>
    </div>
  );
}
