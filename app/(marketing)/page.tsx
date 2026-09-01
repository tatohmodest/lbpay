import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  QrCode,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { FaqJsonLd } from "@/components/json-ld";
import { CheckoutPreview } from "@/components/marketing/checkout-preview";
import { Container } from "@/components/marketing/container";
import { DeveloperCodePanel } from "@/components/marketing/developer-code-panel";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE.url],
  },
};

const rails = ["MTN Mobile Money", "Orange Money", "Cards", "LBPay wallet"];

const stats = [
  { value: "XAF", label: "One currency. The one Cameroon uses." },
  { value: "2%", label: "Deposit fee. Withdrawals are 3%." },
  { value: "PIN", label: "Every send, deposit, and payout is confirmed." },
  { value: "API", label: "Sandbox keys first. Live after KYC." },
];

const bento = [
  {
    href: "/products/business",
    kicker: "Payments",
    title: "Accept payments online and at the counter.",
    copy: "One checkout for MTN, Orange, cards, and wallet. QR and payment links included.",
    className: "md:col-span-2 md:row-span-2",
    image: "/illustrations/merchant-qr.png",
    alt: "Merchant QR checkout accepting Mobile Money in Cameroon",
  },
  {
    href: "/products/wallet",
    kicker: "Wallet",
    title: "Send XAF with an @handle.",
    copy: "Wallet to wallet is instant. Cash out to Mobile Money when it has to leave.",
    className: "",
    image: "/illustrations/hero-send-money.png",
    alt: "People sending money with the LBPay wallet",
  },
  {
    href: "/products/developers",
    kicker: "Developers",
    title: "A payments API, not a wrapper.",
    copy: "Collect, pay out, and receive webhooks in your own product.",
    className: "",
    image: "/illustrations/developer-platform.png",
    alt: "LBPay developer platform",
  },
  {
    href: "/products/business",
    kicker: "Links",
    title: "Share a link. Get paid.",
    copy: "Fixed or open amounts. Works in WhatsApp, Instagram, or SMS.",
    className: "",
    image: "/illustrations/request-money.png",
    alt: "Request money and payment links",
  },
  {
    href: "/products/wallet",
    kicker: "Networks",
    title: "MTN to Orange. One send.",
    copy: "People should not think in networks. LBPay chooses the rail.",
    className: "md:col-span-2",
    image: "/illustrations/cross-network.png",
    alt: "Cross-network Mobile Money transfers",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-canvas font-sans antialiased [font-feature-settings:'kern'_1,'liga'_1]">
      <FaqJsonLd />

      <section className="relative -mt-[var(--header-h)] overflow-hidden text-white">
        <div className="lb-mesh absolute inset-0" />
        <div className="lb-grid pointer-events-none absolute inset-0" />
        <Container className="relative grid items-center gap-12 pb-20 pt-[calc(var(--header-h)+3rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-28 lg:pt-[calc(var(--header-h)+4.5rem)]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Cameroon payments
            </p>
            <h1 className="mt-6 max-w-[13ch] text-[2.7rem] font-semibold leading-[1.05] tracking-[-0.045em] md:text-[4.15rem]">
              Payments infrastructure for Cameroon.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-8 text-hero-muted md:text-lg">
              Collect, send, and settle XAF with MTN, Orange, cards, and a wallet API — from the
              first transfer to a national merchant network.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg" className="rounded-lg px-6">
                  Start now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Explore the docs
                </Button>
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/60">
              <ShieldCheck className="h-4 w-4 text-brand" />
              PIN confirmed. Ledger posted. XAF only.
            </p>
          </div>
          <CheckoutPreview />
        </Container>
      </section>

      <section className="border-b border-line bg-white">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Works with
          </p>
          <div className="flex flex-wrap gap-2">
            {rails.map((rail) => (
              <span
                key={rail}
                className="rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs font-medium text-ink"
              >
                {rail}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section id="products" className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Products
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink md:text-[2.75rem] md:leading-[1.15]">
              Modular payments. One ledger.
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">
              Personal, business, and developers post to the same XAF books. Access is gated by
              role, not by a different stack.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {bento.map((item) => (
              <Link
                key={`${item.kicker}-${item.title}`}
                href={item.href}
                className={`group relative h-full min-h-[240px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(10,37,64,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(10,37,64,0.10)] ${item.className}`}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/90 via-[#0a2540]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                    {item.kicker}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/75">{item.copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Merchant checkout
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-[2.75rem] md:leading-[1.15]">
              Accept payments everywhere Cameroon already pays.
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">
              A customer scans, taps a link, or pays in your app. MTN, Orange, card, or wallet —
              one counter, one settlement, same ledger the wallet uses.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: QrCode, title: "QR at the counter", copy: "Scan, enter an amount, pay." },
                { icon: Store, title: "Payment links", copy: "Share anywhere. Collect in XAF." },
                { icon: Wallet, title: "Wallet checkout", copy: "If they have LBPay, it is instant." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-deep">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.title}</span>
                    <span className="block text-sm text-muted">{item.copy}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/products/business"
              className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-brand-deep"
            >
              See checkout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-line shadow-[0_24px_80px_rgba(10,37,64,0.10)]">
            <Image
              src="/illustrations/branded-business.png"
              alt="LBPay branded business checkout in Cameroon"
              width={1536}
              height={1024}
              className="h-auto w-full"
            />
          </div>
        </Container>
      </section>

      <section className="bg-navy py-20 text-white lg:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Developers
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-[2.75rem] md:leading-[1.15]">
              Reliable infrastructure for any stack.
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-white/65">
              Integrate collections and disbursements in XAF. Sandbox keys when you apply. Live
              keys after KYC. Payments, payouts, payment links, webhooks, and balance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/docs">
                <Button size="lg" className="rounded-lg">
                  View developer docs
                </Button>
              </Link>
              <Link href="/products/developers">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-lg border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  See the API <Code2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <DeveloperCodePanel />
        </Container>
      </section>

      <section className="border-y border-line bg-white">
        <Container className="grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.value}>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-ink">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{stat.label}</p>
            </div>
          ))}
        </Container>
      </section>

      <section id="how-lbpay-works" className="bg-canvas py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.15]">
              Built for how Cameroon already moves money.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-muted">
              The product is the ledger and the checkout. The networks are rails.
            </p>
          </div>
          <article className="space-y-5 text-[15px] leading-7 text-ink">
            <p>
              LBPay is a Cameroon fintech platform for sending money, receiving money, and
              collecting payments in Central African CFA franc (XAF). It is built around how
              people already move cash: MTN Mobile Money, Orange Money, cards, and a stored wallet
              with an @handle.
            </p>
            <p>
              Anyone can open a personal wallet from the signup page. After an email one-time code
              and a PIN, you hold XAF, send to a phone number or an @handle, request money, and
              split a bill. Transfers between two LBPay wallets post on the ledger immediately.
              When cash has to leave to MTN or Orange, LBPay runs a disbursement on the payment
              rail.
            </p>
            <p>
              Sending from MTN to Orange is the consumer job people actually have. You enter an
              amount in XAF, a number or @handle, and confirm with your PIN. LBPay chooses whether
              the move stays inside the wallet or goes out as a Mobile Money payout.
            </p>
            <p>
              Merchants in Douala, Yaoundé, Bafoussam, and the rest of Cameroon get one checkout:
              QR codes, payment links, MTN, Orange, cards, and wallet. Teams that need a Mobile
              Money API integrate LBPay, not a single processor. Read the{" "}
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
        </Container>
      </section>

      <section id="faq" className="bg-white py-20 lg:py-28" aria-labelledby="faq-heading">
        <Container className="max-w-3xl">
          <h2 id="faq-heading" className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Questions, answered
          </h2>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </Container>
      </section>

      <section className="bg-canvas py-20 lg:py-24">
        <Container>
          <div className="overflow-hidden rounded-[1.75rem] bg-navy px-8 py-12 text-white md:flex md:items-center md:justify-between md:px-14 md:py-16">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/65">
                Create an account instantly. Email, a one-time code, a PIN — then send XAF across
                Cameroon.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 md:mt-0">
              <Link href="/signup">
                <Button size="lg" className="rounded-lg">
                  Start now
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-lg border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Read the docs
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
