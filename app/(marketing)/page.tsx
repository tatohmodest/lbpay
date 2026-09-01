import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe,
  Lock,
  Play,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { FaqJsonLd } from "@/components/json-ld";
import { Container } from "@/components/marketing/container";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SendWidget } from "@/components/marketing/send-widget";
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

const features = [
  { icon: Zap, title: "Fast & affordable", copy: "Wallet to wallet is instant. No waiting on a float agent." },
  { icon: Globe, title: "Built for Cameroon", copy: "XAF only. MTN, Orange, cards, and a stored wallet." },
  { icon: Wallet, title: "Extra clear fees", copy: "Deposits 2%. Withdrawals 3%. Transfers inside LBPay are free." },
  { icon: Lock, title: "Secure & trusted", copy: "Email OTP, a 4-digit PIN, and a ledger that posts every move." },
];

const steps = [
  { n: "01", title: "Create account", copy: "Name, email, phone, password. Confirm with a 6-digit code." },
  { n: "02", title: "Set your PIN", copy: "Four digits. You use it on every send, deposit, and withdrawal." },
  { n: "03", title: "Send money", copy: "A number or an @handle. LBPay picks the rail underneath." },
];

const quotes = [
  {
    name: "Aisha N.",
    role: "Designer, Douala",
    image: "/illustrations/portrait-aisha.png",
    quote: "I send to an @handle now. I do not think about MTN or Orange until someone needs cash out.",
    tone: "brand",
  },
  {
    name: "Jean M.",
    role: "Shop owner, Yaoundé",
    image: "/illustrations/portrait-jean.png",
    quote: "Customers scan the QR and pay with whatever they already have. One counter. That is the whole job.",
    tone: "white",
  },
  {
    name: "Mira K.",
    role: "Developer, Bafoussam",
    image: "/illustrations/portrait-mira.png",
    quote: "Sandbox keys the same day I applied. The payments API is the product. The networks stay underneath.",
    tone: "white",
  },
];

const cities = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Buea"];

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-6 text-ink">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-paper">
      <FaqJsonLd />

      <section className="-mt-[var(--header-h)] bg-forest text-white">
        <Container className="pb-10 pt-[calc(var(--header-h)+3.5rem)] text-center md:pb-6 md:pt-[calc(var(--header-h)+4.5rem)]">
          <h1 className="mx-auto max-w-[16ch] text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.04em] md:text-[4.25rem]">
            Cameroon payments, made easy.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-8 text-hero-muted md:text-lg">
            Send, receive, and collect XAF. MTN, Orange, cards, and a wallet with an @handle —
            one ledger underneath.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-7">
                Open an account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#how-lbpay-works">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full border-white/25 bg-transparent px-7 text-white hover:bg-white/10"
              >
                <Play className="h-4 w-4 fill-current" /> How it works
              </Button>
            </Link>
          </div>
        </Container>
        <div className="relative mx-auto max-w-[1180px] px-5 md:px-8">
          <Image
            src="/illustrations/hero-devices.png"
            alt="LBPay wallet on desktop and phone, balances in XAF"
            width={1600}
            height={900}
            priority
            className="h-auto w-full rounded-t-[1.5rem] md:rounded-t-[2rem]"
          />
        </div>
      </section>

      <section className="bg-white">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Works with
          </p>
          <div className="flex flex-wrap gap-2">
            {rails.map((rail) => (
              <span
                key={rail}
                className="rounded-full bg-paper px-4 py-1.5 text-sm font-medium text-ink"
              >
                {rail}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section id="products" className="bg-paper py-20 lg:py-24">
        <Container>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-[-0.03em] text-ink md:text-[2.6rem] md:leading-[1.15]">
            Fast and secure money transfers for people and businesses.
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Link
              href="/products/wallet"
              className="overflow-hidden rounded-[1.75rem] bg-forest text-white shadow-[0_20px_50px_rgba(6,38,28,0.18)]"
            >
              <div className="p-8 pb-4">
                <p className="text-sm font-semibold text-brand">For personal</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Your XAF wallet, with an @handle.</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Send, request, split, and cash out to Mobile Money.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                  Open wallet <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <Image
                src="/illustrations/personal-phone.png"
                alt="LBPay personal wallet on a phone"
                width={1200}
                height={900}
                className="h-auto w-full"
              />
            </Link>
            <Link
              href="/products/business"
              className="overflow-hidden rounded-[1.75rem] bg-forest text-white shadow-[0_20px_50px_rgba(6,38,28,0.18)]"
            >
              <div className="p-8 pb-4">
                <p className="text-sm font-semibold text-brand">For businesses</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">One counter for every way Cameroon pays.</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  QR, payment links, MTN, Orange, cards, and wallet.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                  See checkout <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <Image
                src="/illustrations/business-kit.png"
                alt="LBPay merchant QR, card, and dashboard"
                width={1200}
                height={900}
                className="h-auto w-full"
              />
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              The money transfer layer Cameroon already needed.
            </h2>
            <Link href="/signup">
              <Button className="rounded-full px-6">Get started</Button>
            </Link>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div key={item.title}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-paper py-20 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              One account for MTN, Orange, and XAF.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-muted">
              Hold a balance, send to a phone or @handle, and only settle out to Mobile Money when
              cash has to leave the ledger.
            </p>
            <ul className="mt-6 space-y-3">
              <Tick>@handle instead of memorising numbers</Tick>
              <Tick>Wallet to wallet posts instantly</Tick>
              <Tick>Cash out to MTN or Orange when you need it</Tick>
            </ul>
            <Link href="/products/wallet" className="mt-8 inline-block">
              <Button className="rounded-full px-6">See the wallet</Button>
            </Link>
          </div>
          <Image
            src="/illustrations/wallet-panel.png"
            alt="LBPay XAF balances across MTN, Orange, wallet, and cards"
            width={1200}
            height={900}
            className="h-auto w-full"
          />
        </Container>
      </section>

      <section className="bg-forest py-20 text-white lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Image
            src="/illustrations/debit-card.png"
            alt="LBPay emerald payment card for Cameroon XAF"
            width={1600}
            height={900}
            className="h-auto w-full"
          />
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              Checkout that feels native across Cameroon.
            </h2>
            <ul className="mt-6 space-y-3">
              <li className="flex gap-3 text-[15px] leading-6 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                QR at the counter, payment links in WhatsApp
              </li>
              <li className="flex gap-3 text-[15px] leading-6 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                MTN, Orange, cards, and wallet on one settlement
              </li>
              <li className="flex gap-3 text-[15px] leading-6 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                Same XAF ledger the personal wallet uses
              </li>
            </ul>
            <Link href="/products/business" className="mt-8 inline-block">
              <Button className="rounded-full px-6">Start collecting</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              One app for all your XAF transfers.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-muted">
              Send, request, split, deposit, and withdraw. Install LBPay on your phone or keep it in
              the browser.
            </p>
            <ul className="mt-6 space-y-3">
              <Tick>PIN on every money move</Tick>
              <Tick>History, beneficiaries, and QR receive</Tick>
              <Tick>Works as a PWA on iOS and Android</Tick>
            </ul>
            <Link href="/signup" className="mt-8 inline-block">
              <Button className="rounded-full px-6">Get the app</Button>
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[320px]">
            <Image
              src="/illustrations/app-phone.png"
              alt="LBPay mobile app home screen"
              width={900}
              height={1600}
              className="h-auto w-full"
            />
          </div>
        </Container>
      </section>

      <section className="bg-paper py-20 lg:py-24">
        <Container>
          <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem]">
            Customer success is our success.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {quotes.map((item) => (
              <article
                key={item.name}
                className={
                  item.tone === "brand"
                    ? "rounded-[1.5rem] bg-brand p-6 text-white"
                    : "rounded-[1.5rem] bg-white p-6 shadow-[0_8px_30px_rgba(6,38,28,0.06)]"
                }
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={item.image}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className={`text-xs ${item.tone === "brand" ? "text-white/80" : "text-muted"}`}>
                      {item.role}
                    </p>
                  </div>
                </div>
                <p className={`mt-5 text-sm leading-6 ${item.tone === "brand" ? "text-white" : "text-ink"}`}>
                  “{item.quote}”
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="how-lbpay-works" className="bg-white py-20 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SendWidget />
          <div>
            <p className="text-sm font-semibold text-brand-deep">Getting started</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              It is simple to start using LBPay.
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{step.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted">{step.copy}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-10 lg:py-14">
        <Container>
          <div className="grid items-center gap-8 overflow-hidden rounded-[1.75rem] bg-forest px-8 py-10 text-white md:grid-cols-2 md:px-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Wallet transfers are free.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
                LBPay to LBPay posts on the ledger with no fee. You only pay when money leaves to
                MTN or Orange.
              </p>
              <Link href="/signup" className="mt-6 inline-block">
                <Button className="rounded-full px-6">Register now</Button>
              </Link>
            </div>
            <Image
              src="/illustrations/wallet-3d.png"
              alt=""
              width={1200}
              height={675}
              className="h-auto w-full justify-self-end md:max-w-sm"
            />
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem] md:leading-[1.15]">
              Send money across Cameroon with LBPay.
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {cities.map((city) => (
                <li key={city} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  {city}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-muted">
              Built for how people already move cash in Douala, Yaoundé, and the rest of the
              country.
            </p>
          </div>
          <Image
            src="/illustrations/cameroon-map.png"
            alt="Map of Cameroon highlighting coverage"
            width={1600}
            height={900}
            className="h-auto w-full"
          />
        </Container>
      </section>

      <section id="faq" className="bg-paper py-20 lg:py-24" aria-labelledby="faq-heading">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <h2 id="faq-heading" className="text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem]">
              Common questions.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Wallet, checkout, and the payments API — answered without the jargon.
            </p>
          </div>
          <FaqAccordion />
        </Container>
      </section>

      <section className="bg-forest py-16 text-center text-white md:py-20">
        <Container>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Set up and move money with LBPay.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/70">
            Email, a one-time code, a PIN. Then send XAF across Cameroon.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-8">
                Open an account
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full border-white/25 bg-transparent px-8 text-white hover:bg-white/10"
              >
                Read the docs
              </Button>
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck className="h-4 w-4 text-brand" />
            PIN confirmed. Ledger posted. XAF only.
          </p>
        </Container>
      </section>
    </div>
  );
}
