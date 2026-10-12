import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Eye,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Store,
  TimerReset,
  Wallet,
} from "lucide-react";
import { Suspense } from "react";
import { AppImg } from "@/components/app-img";
import { FaqJsonLd } from "@/components/json-ld";
import { Container } from "@/components/marketing/container";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeeCalculator } from "@/components/marketing/fee-calculator";
import { HomeReviews } from "@/components/marketing/home-reviews";
import { AfricaCorridors, SavingsShowcase } from "@/components/marketing/growth-sections";
import {
  ApiConsole,
  CheckoutCard,
  PhoneFrame,
  SecureToast,
  SentToast,
  WalletScreen,
} from "@/components/marketing/mocks";
import {
  Accent,
  ButtonLink,
  CtaBand,
  Eyebrow,
  Feature,
  Lead,
  SectionTitle,
} from "@/components/marketing/ui";
import { SITE_DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from "@/lib/site";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { FEE_RATES, feePercent } from "@/lib/fees";
import { CONTACT_EMAIL } from "@/lib/flags";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
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

const cities = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Buea"];

const protections = [
  {
    icon: KeyRound,
    title: "Your PIN on every payment",
    copy: "Nothing leaves your wallet without your 4-digit PIN. Four wrong tries and it locks.",
  },
  {
    icon: Fingerprint,
    title: "Secrets we can't read",
    copy: "Passwords and PINs are stored as salted scrypt hashes. Not even our team can see them.",
  },
  {
    icon: FileCheck2,
    title: "A ledger for every franc",
    copy: "Each movement is posted with its own reference, so your history always adds up.",
  },
  {
    icon: RotateCcw,
    title: "Automatic refunds",
    copy: "If MTN or Orange rejects a payout, the amount and the fee come back to you.",
  },
  {
    icon: TimerReset,
    title: "Sessions that lock themselves",
    copy: "Leave LBPay open on the web and it signs out after 15 quiet minutes.",
  },
  {
    icon: Eye,
    title: "Limits until we know it's you",
    copy: "Outgoing transfers are capped at 500,000 XAF a day until your ID is verified.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create your account",
    copy: "Name, email, phone number. Confirm with the 6-digit code we email you. About two minutes.",
  },
  {
    n: "2",
    title: "Set your PIN",
    copy: "Four digits that only you know. You'll use it every time money moves.",
  },
  {
    n: "3",
    title: "Send, save, get paid",
    copy: "Pick an @handle, add money from MTN or Orange, and you're ready.",
  },
];

export default async function LandingPage() {
  const locale = await getRequestLocale();
  const t = (path: string) => translate(locale, path);

  return (
    <div className="bg-paper">
      <FaqJsonLd />

      {/* ------------------------------------------------------------ Hero */}
      <section className="relative -mt-[var(--header-h)] overflow-hidden bg-forest text-white">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative grid items-center gap-14 pb-20 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+4.5rem)] lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
          <div className="lb-rise text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[12px] font-medium text-hero-muted ring-1 ring-white/10">
              <span className="lb-live-dot h-1.5 w-1.5 rounded-full bg-brand" />
              {t("home.heroPill")}
            </p>
            <h1 className="mx-auto mt-7 max-w-[13ch] text-balance text-[3rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.75rem] lg:mx-0 lg:text-[5rem]">
              {t("home.heroTitle")} <Accent className="text-brand">{t("home.heroAccent")}</Accent>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-pretty text-[17px] leading-8 text-hero-muted lg:mx-0 lg:text-lg">
              {t("home.heroCopy")}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <ButtonLink href="/signup" arrow>
                {t("home.openAccount")}
              </ButtonLink>
              <ButtonLink href="/#fees" variant="ghost-dark">
                {t("home.howItWorks")}
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-white/60 lg:justify-start">
              <li className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-brand" /> PIN on every payment
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Fees shown before you pay
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-brand" /> Failed payouts refunded
              </li>
            </ul>
          </div>

          <div className="lb-rise relative mx-auto [animation-delay:200ms]">
            <div className="absolute -inset-10 rounded-full bg-brand/20 blur-3xl" />
            <PhoneFrame className="relative">
              <WalletScreen />
            </PhoneFrame>
            <SentToast className="lb-float absolute -left-20 top-[46%] hidden sm:flex" />
            <SecureToast className="lb-float-delayed absolute -right-12 top-20 hidden sm:flex" />
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Rails */}
      <section className="border-b border-line bg-white">
        <Container className="flex flex-col items-center justify-between gap-5 py-7 md:flex-row">
          <p className="text-[13px] font-medium text-muted">Works with the money Cameroon already uses</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { short: "MTN", label: "MTN Mobile Money", tone: "bg-mtn text-black" },
              { short: "OM", label: "Orange Money", tone: "bg-om text-white" },
              { short: "LB", label: "LBPay wallet", tone: "bg-brand text-white" },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-2.5 text-[14px] font-semibold text-ink">
                <span className={`grid h-7 w-7 place-items-center rounded-lg text-[8px] font-black ${r.tone}`}>
                  {r.short}
                </span>
                {r.label}
              </li>
            ))}
            <li className="text-[13px] font-medium text-muted">Cards coming soon</li>
          </ul>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Products */}
      <section id="products" className="py-20 lg:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">One account</Eyebrow>
            <SectionTitle className="mt-4">
              Everything you do with money, <Accent>in one place.</Accent>
            </SectionTitle>
            <Lead className="mx-auto mt-5 max-w-xl">
              Start with a personal wallet. Open a shop when you&apos;re ready to sell. Build with the API when
              your product needs to take payments.
            </Lead>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <ProductTile
              href="/products/wallet"
              icon={Wallet}
              eyebrow="Personal"
              title="Your XAF wallet, with your name on it."
              copy="Send to an @handle or any MTN and Orange number. Request money, save toward goals, cash out."
              visual={
                <div className="lb-house-card mx-auto w-full max-w-[280px] rounded-2xl p-4 text-white">
                  <p className="text-[11px] text-white/75">@ngono · Wallet</p>
                  <p className="tabular mt-1 text-2xl font-bold">84 200 XAF</p>
                  <div className="mt-4 flex gap-1.5">
                    {["Send", "Request", "Save"].map((a) => (
                      <span key={a} className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              }
            />
            <ProductTile
              href="/products/business"
              icon={Store}
              eyebrow="Business"
              title="Get paid by link, QR, or shop page."
              copy="Share a product on WhatsApp. Customers pay with MTN, Orange, or wallet. You get one balance."
              visual={
                <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-4 text-ink shadow-sm ring-1 ring-line">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-soft">👗</span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[12px] font-bold">Boutique Ndolo</p>
                      <p className="text-[10px] text-muted">3 new payments today</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2">
                    <span className="text-[11px] text-muted">Today</span>
                    <span className="tabular text-[13px] font-bold">+ 46 500 XAF</span>
                  </div>
                </div>
              }
            />
            <ProductTile
              href="/products/developers"
              icon={Code2}
              eyebrow="Developers"
              title="A payments API that speaks XAF."
              copy="Collect and pay out on MTN and Orange with one integration. Sandbox first, live when verified."
              visual={
                <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-[#07120e] p-4 font-mono text-[11px] leading-5 text-white/70">
                  <p>
                    <span className="text-brand">POST</span> /v1/payments
                  </p>
                  <p className="text-white/40">→ 201 · pay_8Kq2…</p>
                  <p className="mt-1">
                    status: <span className="text-[#9fe8c4]">&quot;success&quot;</span>
                  </p>
                </div>
              }
            />
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Fees */}
      <section id="fees" className="bg-white py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>Pricing</Eyebrow>
            <SectionTitle className="mt-4">
              Fees on the wall, <Accent>not in the fine print.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              No monthly fee and no exchange-rate tricks. You see the fee and the total before you enter your PIN,
              and the person you pay always receives the full amount.
            </Lead>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
              {[
                { k: "LBPay to LBPay", v: "Free" },
                { k: "Add money", v: `${feePercent(FEE_RATES.deposit)}%` },
                { k: "To MTN or Orange", v: `${feePercent(FEE_RATES.withdraw)}%` },
                { k: "MTN ↔ Orange direct", v: `${feePercent(FEE_RATES.crossNetwork)}%` },
              ].map((row) => (
                <div key={row.k} className="bg-white p-5">
                  <dt className="text-[13px] text-muted">{row.k}</dt>
                  <dd className="tabular mt-1 text-2xl font-bold tracking-tight text-ink">{row.v}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-deep hover:underline"
            >
              See full pricing and limits <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FeeCalculator />
        </Container>
      </section>

      {/* ------------------------------------------------------------ Security */}
      <section className="relative overflow-hidden bg-forest py-20 text-white lg:py-28">
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <Eyebrow tone="dark">Security</Eyebrow>
              <SectionTitle className="mt-4">
                Built to guard <Accent className="text-brand">every franc.</Accent>
              </SectionTitle>
            </div>
            <p className="max-w-lg text-[17px] leading-8 text-hero-muted">
              Trust isn&apos;t a badge we put on a page. It&apos;s a set of rules the app follows every
              single time money moves. Here are the ones that matter most.
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {protections.map((p) => (
              <Feature key={p.title} icon={p.icon} title={p.title} tone="dark">
                {p.copy}
              </Feature>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
            <ButtonLink href="/security" variant="white" size="md" arrow>
              How we protect your money
            </ButtonLink>
            <p className="text-[14px] text-white/50">Written in plain language, no jargon.</p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Business + API */}
      <section className="py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative order-2 flex justify-center lg:order-1">
            <div className="absolute inset-6 rounded-[2.5rem] bg-forest" />
            <div className="relative px-6 py-10 sm:px-12">
              <CheckoutCard />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>For business</Eyebrow>
            <SectionTitle className="mt-4">
              Your shop, <Accent>open everywhere</Accent> your customers are.
            </SectionTitle>
            <Lead className="mt-5">
              Make a link for a product, a whole shop page, or a QR code for the counter. Customers pay from the
              phone in their hand. You see every payment arrive, with a record you can trust.
            </Lead>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/products/business" arrow>
                Start selling
              </ButtonLink>
              <ButtonLink href="/products/developers" variant="secondary">
                Use the API
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <SavingsShowcase />

      {/* ------------------------------------------------------------ Steps */}
      <section id="how-lbpay-works" className="bg-white py-20 lg:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Getting started</Eyebrow>
              <SectionTitle className="mt-4 max-w-xl">
                Ready in <Accent>two minutes.</Accent>
              </SectionTitle>
            </div>
            <ButtonLink href="/signup" arrow className="self-start md:self-auto">
              Open your free account
            </ButtonLink>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="relative rounded-[1.5rem] bg-paper p-7 ring-1 ring-line/60">
                <span className="font-display text-6xl italic leading-none text-brand">{step.n}</span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">{step.copy}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Suspense fallback={null}>
        <HomeReviews />
      </Suspense>

      {/* ------------------------------------------------------------ API */}
      <section className="relative overflow-hidden bg-forest py-20 text-white lg:py-28">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <Container className="relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow tone="dark">For developers</Eyebrow>
            <SectionTitle className="mt-4">
              One integration. <Accent className="text-brand">Both networks.</Accent>
            </SectionTitle>
            <p className="mt-5 max-w-lg text-[17px] leading-8 text-hero-muted">
              Take payments and send payouts on MTN Mobile Money and Orange Money with a single REST API. Test
              everything in the sandbox. Go live once you&apos;re verified.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/docs" variant="white" arrow>
                Read the docs
              </ButtonLink>
              <ButtonLink href="/products/developers" variant="ghost-dark">
                Developer platform
              </ButtonLink>
            </div>
          </div>
          <ApiConsole />
        </Container>
      </section>

      <AfricaCorridors cities={cities} />

      {/* ------------------------------------------------------------ Made here */}
      <section className="bg-white py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-20">
          <figure>
            <Eyebrow>Made in Cameroon</Eyebrow>
            <blockquote className="mt-6 text-balance text-[1.75rem] font-medium leading-[1.3] tracking-[-0.02em] text-ink md:text-[2.25rem]">
              <span className="font-display italic text-brand">&ldquo;</span>We built LBPay because sending money at home
              shouldn&apos;t mean guessing the fee, waiting on an agent, or wondering if it arrived.
              <span className="font-display italic text-brand">&rdquo;</span>
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <AppImg
                src="/illustrations/lbpay-mark.webp"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-cover"
              />
              <span className="leading-tight">
                <span className="block text-[15px] font-semibold text-ink">The LBPay team</span>
                <span className="block text-[13px] text-muted">Looping Binary · Cameroon</span>
              </span>
            </figcaption>
          </figure>
          <div className="rounded-[1.75rem] bg-paper p-7 ring-1 ring-line/60">
            <p className="text-[15px] font-semibold text-ink">Talk to us directly</p>
            <p className="mt-2 text-[15px] leading-7 text-muted">
              Questions, a payment that looks wrong, or an idea? Write to the people who build the app.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-[15px] font-semibold text-ink ring-1 ring-line transition hover:ring-brand/40"
            >
              {CONTACT_EMAIL}
              <ArrowRight className="h-4 w-4 text-brand-deep" />
            </a>
            <Link
              href="/about"
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-deep hover:underline"
            >
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section id="faq" className="py-20 lg:py-28" aria-labelledby="faq-heading">
        <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow>Help</Eyebrow>
            <SectionTitle className="mt-4">
              <span id="faq-heading">
                Questions, <Accent>answered.</Accent>
              </span>
            </SectionTitle>
            <Lead className="mt-5">
              The honest answers to what people ask us most: fees, safety, and what happens when something goes
              wrong.
            </Lead>
          </div>
          <FaqAccordion />
        </Container>
      </section>

      <CtaBand
        title={
          <>
            Your money deserves a <Accent className="text-brand">home.</Accent>
          </>
        }
        copy="Free to open, free between wallets, and every fee shown before you pay. Set up in two minutes."
        secondary={{ href: "/security", label: "How we keep it safe" }}
      />
    </div>
  );
}

function ProductTile({
  href,
  icon: Icon,
  eyebrow,
  title,
  copy,
  visual,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  copy: string;
  visual: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(6,38,28,0.3)] hover:ring-brand/30"
    >
      <div className="flex-1 p-7">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-deep">
          <Icon className="h-4 w-4" /> {eyebrow}
        </p>
        <h3 className="mt-4 text-[1.35rem] font-bold leading-snug tracking-tight text-ink">{title}</h3>
        <p className="mt-3 text-[15px] leading-7 text-muted">{copy}</p>
      </div>
      <div className="relative mx-3 mb-3 rounded-[1.25rem] bg-paper px-5 py-8">
        {visual}
        <span className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line transition group-hover:bg-brand group-hover:text-white group-hover:ring-brand">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
