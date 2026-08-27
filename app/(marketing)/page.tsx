import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2, QrCode, ShieldCheck, Store, Wallet } from "lucide-react";
import { FaqJsonLd } from "@/components/json-ld";
import { Container } from "@/components/marketing/container";
import { MediaSplit } from "@/components/marketing/media-split";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE_DESCRIPTION, SITE_FAQS, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
};

const products = [
  {
    icon: Wallet,
    title: "Personal",
    copy: "An XAF wallet with an @handle, deposits, withdrawals, airtime, bills, and instant transfers.",
    href: "/products/wallet",
    cta: "See the wallet",
  },
  {
    icon: Store,
    title: "Business",
    copy: "One checkout for MTN, Orange, cards, wallet, payment links, and QR. No network stitching.",
    href: "/products/business",
    cta: "See checkout",
  },
  {
    icon: Code2,
    title: "Developers",
    copy: "Sandbox keys on apply, live keys after KYC. Payments, payouts, webhooks, and a Mobile Money API.",
    href: "/products/developers",
    cta: "See the API",
  },
];

const rails = ["MTN Mobile Money", "Orange Money", "Cards", "LBPay wallet"];

export default function LandingPage() {
  return (
    <div className="font-sans antialiased [font-feature-settings:'kern'_1,'liga'_1]">
      <FaqJsonLd />
      <section className="overflow-hidden bg-white">
        <Container className="grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="order-1 overflow-hidden rounded-[1.75rem] border border-line shadow-[0_24px_80px_rgba(7,20,15,0.10)] lg:order-2">
            <Image
              src="/illustrations/hero-send-money.png"
              alt="People sending money in Cameroon with the LBPay XAF wallet"
              width={1536}
              height={1024}
              className="h-auto w-full"
              priority
            />
          </div>
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Cameroon payments
            </p>
            <h1 className="mt-4 max-w-[18ch] text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink md:text-[3.35rem]">
              Move XAF with the quiet confidence of a bank, and the speed of Mobile Money.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-8 text-muted md:text-lg">
              LBPay is the wallet, checkout, and payments API for Cameroon. MTN, Orange, cards,
              and the ledger sit underneath. You send, collect, or build. The rails stay out of
              the way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Create your wallet <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="secondary">
                  Read the API
                </Button>
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck className="h-4 w-4 text-brand" />
              PIN confirmed. Ledger posted. XAF only.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Works with
          </p>
          <div className="flex flex-wrap gap-2">
            {rails.map((rail) => (
              <span
                key={rail}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink"
              >
                {rail}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section id="products" className="bg-white py-16 lg:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Products
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Three products. One ledger.
            </h2>
            <p className="mt-3 text-muted">
              Personal, business, and developers post to the same XAF books. Access is gated by
              role, not by a different stack.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {products.map((item) => (
              <Card key={item.title} className="flex flex-col p-6 transition hover:border-brand/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.copy}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-deep"
                >
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <MediaSplit
        image="/illustrations/cross-network.png"
        alt="Send money from MTN Mobile Money to Orange Money through LBPay"
        reverse
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
          Cross-network
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          MTN to Orange. One send.
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-muted">
          People should not think in networks. They send 20,000 XAF to a number or an @handle.
          LBPay chooses the rail, posts the ledger, and only settles out when money has to leave.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-ink">
          <li>Send to an @handle instead of a phone number</li>
          <li>Wallet to wallet stays on the ledger</li>
          <li>Request money, split bills, and share payment links</li>
        </ul>
      </MediaSplit>

      <MediaSplit
        image="/illustrations/merchant-qr.png"
        alt="Cameroon merchant QR checkout accepting MTN, Orange, cards, and wallet"
        tone="navy"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Merchant checkout
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          QR, payment links, one counter.
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-white/70">
          A customer scans, enters an amount, and pays with MTN, Orange, card, or wallet. The
          merchant never implements those methods one by one.
        </p>
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/80">
          <QrCode className="h-4 w-4 text-brand" /> Scan, pay, settle
        </p>
      </MediaSplit>

      <MediaSplit
        image="/illustrations/developer-platform.png"
        alt="LBPay developer platform for Mobile Money payments and payouts in XAF"
        reverse
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
          Developers
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Payments, payouts, sandbox, webhooks.
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-muted">
          Integrate collections and disbursements in XAF. Sandbox keys are issued when you apply.
          Live keys wait for KYC.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-2xl bg-navy p-5 font-mono text-[11px] leading-6 text-emerald-100">
{`const payment = await lbpay.payments.create({
  amount: 5000,
  currency: "XAF",
  customer: { phone: "6XXXXXXXX" },
  method: "mobile_money"
});`}
        </pre>
      </MediaSplit>

      <section id="how-lbpay-works" className="bg-paper py-16 lg:py-24">
        <article className="mx-auto max-w-2xl px-5 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for how Cameroon already moves money
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-ink">
            LBPay is a Cameroon fintech platform for sending money, receiving money, and
            collecting payments in Central African CFA franc (XAF). It is built around how
            people already move cash: MTN Mobile Money, Orange Money, cards, and a stored wallet
            with an @handle. The product is the ledger and the checkout. The networks are rails.
          </p>
          <p className="mt-4 text-[15px] leading-7 text-ink">
            Anyone can open a personal wallet from the signup page. After an email one-time code
            and a PIN, you hold XAF, send to a phone number or an @handle, request money, split
            a bill, buy airtime, and pay bills. Transfers between two LBPay wallets post on the
            ledger immediately. When cash has to leave to MTN or Orange, LBPay runs a
            disbursement on the payment rail so the recipient still gets Mobile Money they can
            spend.
          </p>
          <p className="mt-4 text-[15px] leading-7 text-ink">
            Sending from MTN to Orange is the consumer job people actually have. You should not
            need two apps and a float agent. You enter an amount in XAF, a number or @handle,
            and confirm with your PIN. LBPay chooses whether the move stays inside the wallet or
            goes out as a Mobile Money payout. That is how a digital wallet in Cameroon should
            feel: one send, one currency, the right rail underneath.
          </p>
          <p className="mt-4 text-[15px] leading-7 text-ink">
            Merchants in Douala, Yaoundé, Bafoussam, and the rest of Cameroon should not stitch
            three networks together. After KYC and admin approval, a business gets one checkout:
            QR codes, payment links, MTN, Orange, cards, and wallet. A customer scans or taps a
            link, enters an amount, and pays with the method they already have. Settlement posts
            against the same ledger the wallet uses.
          </p>
          <p className="mt-4 text-[15px] leading-7 text-ink">
            Teams that need a Mobile Money API, disbursement API, or payment gateway in Cameroon
            integrate LBPay, not a single processor. Sandbox keys are issued when you apply.
            Live keys wait for KYC. The API covers payments, payouts, payment links, webhooks,
            and balance, with test amounts that succeed, fail, or stay pending so you can build
            before you take real XAF. Read the{" "}
            <Link href="/docs" className="font-medium text-brand-deep">
              payments API docs
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-medium text-brand-deep">
              create a wallet
            </Link>{" "}
            to start.
          </p>
        </article>
      </section>

      <section id="faq" className="bg-white py-16 lg:py-24" aria-labelledby="faq-heading">
        <Container className="max-w-2xl">
          <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight">
            Questions, answered
          </h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {SITE_FAQS.map((item) => (
              <article key={item.question} className="py-6">
                <h3 className="text-base font-semibold text-ink">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Open a wallet in minutes.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Email, a one-time code, a PIN. Then you can send XAF across Cameroon.
            </p>
          </div>
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
        </Container>
      </section>
    </div>
  );
}
