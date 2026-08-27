import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Link2,
  QrCode,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { FaqJsonLd } from "@/components/json-ld";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";
import { SITE_DESCRIPTION, SITE_FAQS, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FaqJsonLd />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
          <Link href="#products" className="hover:text-brand">
            Products
          </Link>
          <Link href="#how-lbpay-works" className="hover:text-brand">
            How it works
          </Link>
          <Link href="/docs" className="hover:text-brand">
            Docs
          </Link>
          <Link href="/login" className="hover:text-brand">
            Sign in
          </Link>
        </nav>
        <Link href="/signup">
          <Button size="sm">Open wallet</Button>
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Cameroon payment infrastructure
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink md:text-6xl">
              Send money in Cameroon. Wallet, checkout, and a payments API.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              LBPay is the XAF platform people, businesses, and developers use. Move funds
              across MTN Mobile Money, Orange Money, cards, and the LBPay wallet — without
              treating any one network as the product.
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
              Built for XAF, Mobile Money, QR checkout, and developer-grade ledgers.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-line shadow-[0_20px_60px_rgba(0,179,105,0.12)]">
            <Image
              src="/illustrations/hero-send-money.png"
              alt="People sending money in Cameroon with the LBPay XAF wallet"
              width={1536}
              height={1024}
              className="h-auto w-full"
              priority
            />
          </div>
        </section>

        <section id="products" className="bg-paper py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-3xl font-black tracking-tight">Three products. One ledger.</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Open a personal wallet, collect as a business, or call the payments API. Every
              product posts to the same XAF ledger.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 md:grid-cols-3 md:px-8">
            {[
              {
                icon: Wallet,
                title: "Wallet",
                copy: "Personal XAF accounts with @handles, deposits, withdrawals, airtime, bills, and instant LBPay transfers.",
                href: "/signup",
                cta: "Create a wallet",
              },
              {
                icon: Store,
                title: "Business",
                copy: "Accept MTN, Orange, cards, wallet, payment links, and QR — without stitching networks together.",
                href: "/signup",
                cta: "Collect payments",
              },
              {
                icon: Code2,
                title: "Developers",
                copy: "Keys, sandbox, webhooks, payouts, subscriptions, and a Mobile Money API. Infrastructure, not a wrapper.",
                href: "/docs",
                cta: "Read the docs",
              },
            ].map((item) => (
              <Card key={item.title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
                <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
          <Image
            src="/illustrations/cross-network.png"
            alt="Send money from MTN Mobile Money to Orange Money through LBPay"
            width={1536}
            height={1024}
            className="h-auto w-full rounded-[2rem] border border-line"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Cross-network transfers
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">MTN to Orange. One send.</h2>
            <p className="mt-4 text-muted">
              Users should not think in networks. They send 20,000 XAF to a number or an
              @handle. LBPay chooses the rail, posts the ledger, and settles out when money
              has to leave the platform.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink">
              <li>Send to an @handle instead of a phone number</li>
              <li>Internal LBPay to LBPay transfers stay on the ledger</li>
              <li>Request money, split bills, and share payment links</li>
            </ul>
          </div>
        </section>

        <section className="bg-navy py-16 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                Merchant checkout
              </p>
              <h2 className="mt-3 text-3xl font-black">QR, payment links, and a single checkout.</h2>
              <p className="mt-4 text-white/70">
                A customer scans. Enters an amount. Pays with MTN Mobile Money, Orange Money,
                card, or wallet. The merchant never implements those methods one by one.
              </p>
              <div className="mt-6 flex gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-brand" /> QR
                </span>
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-brand" /> Payment links
                </span>
              </div>
            </div>
            <Image
              src="/illustrations/merchant-qr.png"
              alt="Cameroon merchant QR checkout accepting MTN, Orange, cards, and wallet"
              width={1024}
              height={1024}
              className="h-auto w-full rounded-[2rem]"
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Developer platform
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Payments, payouts, sandbox, webhooks.
            </h2>
            <p className="mt-4 text-muted">
              Integrate a Cameroon payments API for XAF collections and disbursements. Sandbox
              keys are issued when you apply. Live keys wait for KYC.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-2xl bg-navy p-5 font-mono text-xs leading-6 text-emerald-100">
{`const payment = await lbpay.payments.create({
  amount: 5000,
  currency: "XAF",
  customer: { phone: "6XXXXXXXX" },
  method: "mobile_money"
});`}
            </pre>
          </div>
          <Image
            src="/illustrations/developer-platform.png"
            alt="LBPay developer platform for Mobile Money payments and payouts in XAF"
            width={1536}
            height={1024}
            className="h-auto w-full rounded-[2rem] border border-line"
          />
        </section>

        <section id="how-lbpay-works" className="bg-paper py-16">
          <article className="mx-auto max-w-3xl px-4 md:px-8">
            <h2 className="text-3xl font-black tracking-tight">How LBPay works in Cameroon</h2>
            <p className="mt-5 text-[15px] leading-7 text-ink">
              LBPay is a Cameroon fintech platform for sending money, receiving money, and
              collecting payments in Central African CFA franc (XAF). It is built around how
              people already move cash: MTN Mobile Money, Orange Money, cards, and a stored
              wallet with an @handle. The product is the ledger and the checkout. The networks
              are rails.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              Anyone can open a personal wallet from the signup page. After an email one-time
              code and a PIN, you hold XAF, send to a phone number or an @handle, request
              money, split a bill, buy airtime, and pay bills. Transfers between two LBPay
              wallets post on the ledger immediately. When cash has to leave to MTN or Orange,
              LBPay runs a disbursement on the payment rail so the recipient still gets Mobile
              Money they can spend.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              Sending from MTN to Orange is the consumer job people actually have. You should
              not need two apps and a float agent. You enter an amount in XAF, a number or
              @handle, and confirm with your PIN. LBPay chooses whether the move stays inside
              the wallet or goes out as a Mobile Money payout. That is how a digital wallet in
              Cameroon should feel: one send, one currency, the right rail underneath.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              Merchants in Douala, Yaoundé, Bafoussam, and the rest of Cameroon should not
              stitch three networks together. After KYC and admin approval, a business gets
              one checkout: QR codes, payment links, MTN, Orange, cards, and wallet. A
              customer scans or taps a link, enters an amount, and pays with the method they
              already have. Settlement posts against the same ledger the wallet uses.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              Teams that need a Mobile Money API, disbursement API, or payment gateway in
              Cameroon integrate LBPay, not a single processor. Sandbox keys are issued when
              you apply. Live keys wait for KYC. The API covers payments, payouts, payment
              links, webhooks, and balance, with test amounts that succeed, fail, or stay
              pending so you can build before you take real XAF. Read the{" "}
              <Link href="/docs" className="font-bold text-brand">
                payments API docs
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="font-bold text-brand">
                create a wallet
              </Link>{" "}
              to start.
            </p>
          </article>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:px-8" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl font-black tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-6">
            {SITE_FAQS.map((item) => (
              <article key={item.question}>
                <h3 className="text-lg font-bold text-ink">{item.question}</h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted">{SITE_DESCRIPTION}</p>
          </div>
          <nav aria-label="Product">
            <p className="text-xs font-bold uppercase tracking-wide text-ink">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/signup" className="hover:text-brand">
                  Open a wallet
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-brand">
                  Payments API
                </Link>
              </li>
              <li>
                <Link href="#how-lbpay-works" className="hover:text-brand">
                  How LBPay works
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-brand">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <p className="text-xs font-bold uppercase tracking-wide text-ink">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/login" className="hover:text-brand">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-brand">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-brand">
                  Sitemap
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
      </footer>
    </div>
  );
}
