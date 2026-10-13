import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  Code2,
  FileText,
  Globe2,
  Handshake,
  Languages,
  Layers,
  Mail,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { productMetadata } from "@/components/marketing/product-page";
import { ApiConsole, CheckoutCard, PhoneFrame, WalletScreen } from "@/components/marketing/mocks";
import { Accent, ButtonLink, CtaBand, Eyebrow, Feature, Lead, PageHero, SectionTitle } from "@/components/marketing/ui";
import { CONTACT_EMAIL, FEATURES } from "@/lib/flags";
import { FEE_RATES, feePercent } from "@/lib/fees";
import { INTERNATIONAL } from "@/lib/countries";
import { SHOP_LIMITS } from "@/lib/shop-limits";

export const metadata = productMetadata(
  "Investors",
  "LBPay is a live payments platform built in Cameroon: wallet, merchant checkout and a payments API on MTN Mobile Money and Orange Money. Here's what we've built, how it earns, and where we're going.",
  "/investors",
);

const fmt = (n: number) => n.toLocaleString("fr-FR");
const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

const problems = [
  {
    title: "Two networks that don't talk",
    copy: "Most people in Cameroon pay with MTN Mobile Money or Orange Money. Moving money between them means agents, guesswork on fees, and waiting.",
  },
  {
    title: "Shops run on notebooks",
    copy: "Small businesses take payments on several phones and reconcile by hand. There's no simple shop page, link or receipt.",
  },
  {
    title: "Builders integrate twice",
    copy: "Any app that wants to take payments has to integrate each network separately and handle the edge cases itself.",
  },
  {
    title: "Saving is a broken promise",
    copy: "Njangi groups prove people want structured saving. Digital tools for it, with real accountability, barely exist.",
  },
];

const built = [
  { icon: Wallet, title: "Personal wallet", copy: "XAF balance, @handle, PIN on every payment, full history." },
  { icon: Repeat, title: "Cross-network transfers", copy: "Deposit and cash out on MTN and Orange, or go MoMo to MoMo directly." },
  { icon: PiggyBank, title: "Discipline savings", copy: "Goal pots with auto-save and a fee that shrinks as savers near the finish." },
  { icon: Store, title: "Merchant checkout", copy: "Shop pages, product links with link previews, QR at the counter." },
  { icon: Code2, title: "Payments API", copy: "Collections, payouts, payment links, sandbox keys and request logs." },
  { icon: ShieldCheck, title: "Operations console", copy: "KYC review, freezes, corrections and an audit log behind OTP step-up." },
];

const revenue = [
  { label: "Adding money (MoMo → wallet)", rate: `${feePercent(FEE_RATES.deposit)}%`, example: 20_000, r: FEE_RATES.deposit },
  { label: "Cash-out and payouts (wallet → MoMo)", rate: `${feePercent(FEE_RATES.withdraw)}%`, example: 50_000, r: FEE_RATES.withdraw },
  { label: "Direct MTN ↔ Orange transfers", rate: `${feePercent(FEE_RATES.crossNetwork)}%`, example: 30_000, r: FEE_RATES.crossNetwork },
  { label: "Customer paying a merchant by MoMo", rate: `${feePercent(FEE_RATES.deposit)}%`, example: 15_000, r: FEE_RATES.deposit },
];

const moats = [
  {
    icon: AtSign,
    title: "A network, not a pipe",
    copy: "Wallet-to-wallet is free, so every new user makes LBPay more useful to the people they pay. @handles keep phone numbers private and money inside.",
  },
  {
    icon: Store,
    title: "Merchants recruit users",
    copy: "Every checkout invites the payer to open a free wallet for fee-free payments next time. Shops become a distribution channel.",
  },
  {
    icon: Layers,
    title: "Three products, one ledger",
    copy: "Consumers, merchants and developers share one XAF ledger, so value moves between them without leaving the platform.",
  },
  {
    icon: PiggyBank,
    title: "Savings drive retention",
    copy: "Pots create a daily or weekly reason to come back, and balances that stay on the platform.",
  },
  {
    icon: Languages,
    title: "Built for here",
    copy: "English and French, XAF-native, MTN and Orange first, with copy written for first-time digital savers.",
  },
  {
    icon: Globe2,
    title: "Room to grow",
    copy: "Six CEMAC countries share the same currency. Corridors to West African markets are already built and waiting to open.",
  },
];

export default function InvestorsPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="Investors"
        title={
          <>
            Invest in how Cameroon <Accent className="text-brand">moves money.</Accent>
          </>
        }
        lead="LBPay is a live payments platform built in Cameroon: a wallet for people, checkout for businesses and an API for developers, running on MTN Mobile Money and Orange Money. We're looking for partners to help us scale it."
        actions={
          <>
            <ButtonLink href={mail("LBPay investor deck request")} arrow>
              Request the deck
            </ButtonLink>
            <ButtonLink href={mail("Intro call with LBPay")} variant="ghost-dark">
              Book an intro call
            </ButtonLink>
          </>
        }
        aside={
          <div className="relative mx-auto w-fit">
            <div className="absolute -inset-10 rounded-full bg-brand/20 blur-3xl" />
            <PhoneFrame className="relative">
              <WalletScreen />
            </PhoneFrame>
          </div>
        }
      />

      {/* At a glance */}
      <section className="border-b border-line bg-white">
        <Container className="grid grid-cols-2 gap-px py-0 md:grid-cols-4">
          {[
            { v: "Live", k: "Product in production" },
            { v: "3", k: "Products on one ledger" },
            { v: "2", k: "Mobile Money networks" },
            { v: "EN · FR", k: "Fully bilingual" },
          ].map((s) => (
            <div key={s.k} className="px-2 py-8 text-center">
              <p className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{s.v}</p>
              <p className="mt-1 text-[13px] text-muted">{s.k}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Problem */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>The problem</Eyebrow>
            <SectionTitle className="mt-4">
              Everyone has Mobile Money. <Accent>Nobody has it easy.</Accent>
            </SectionTitle>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {problems.map((p, i) => (
              <div key={p.title} className="rounded-[1.5rem] bg-white p-6 ring-1 ring-line">
                <span className="font-display text-4xl italic leading-none text-brand">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">{p.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* What's built */}
      <section className="relative overflow-hidden bg-forest py-20 text-white lg:py-28">
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <Eyebrow tone="dark">What&apos;s built</Eyebrow>
              <SectionTitle className="mt-4">
                Not a pitch. <Accent className="text-brand">A working product.</Accent>
              </SectionTitle>
            </div>
            <p className="max-w-lg text-[17px] leading-8 text-hero-muted">
              Everything below is live today. Open an account and try it yourself in two minutes: it&apos;s the best due
              diligence we can offer.
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {built.map((b) => (
              <Feature key={b.title} icon={b.icon} title={b.title} tone="dark">
                {b.copy}
              </Feature>
            ))}
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 justify-center rounded-[2rem] bg-white/[0.04] p-3 ring-1 ring-white/10 sm:p-6">
              <CheckoutCard className="min-w-0" />
            </div>
            <div className="flex min-w-0 items-center rounded-[2rem] bg-white/[0.04] p-3 ring-1 ring-white/10 sm:p-6">
              <ApiConsole />
            </div>
          </div>
          <div className="mt-10">
            <ButtonLink href="/signup" variant="white" arrow>
              Try LBPay yourself
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Business model */}
      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <Eyebrow>Business model</Eyebrow>
            <SectionTitle className="mt-4">
              We earn when money <Accent>moves on or off.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Moving money inside LBPay is free, which grows the network. Revenue comes from the moments money enters or
              leaves it, plus merchant and developer services. Every fee is public and shown before the user confirms.
            </Lead>
            <ul className="mt-8 space-y-3 text-[15px] text-ink">
              <li className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> Shop growth packs:{" "}
                {fmt(SHOP_LIMITS.packPrice)} XAF per {SHOP_LIMITS.packSize} extra products
              </li>
              <li className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> API payouts at the standard{" "}
                {feePercent(FEE_RATES.withdraw)}% rate
              </li>
              <li className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> Cross-border transfers at{" "}
                {feePercent(INTERNATIONAL.feeRate)}%{FEATURES.international ? "" : " (built, opening soon)"}
              </li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 bg-paper px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted md:px-7">
              <span>Revenue line</span>
              <span className="text-right">Fee</span>
              <span className="w-24 text-right">Example</span>
            </div>
            {revenue.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-line px-5 py-4 md:px-7"
              >
                <span className="text-[14px] font-semibold text-ink">{r.label}</span>
                <span className="tabular text-right text-[15px] font-bold text-ink">{r.rate}</span>
                <span className="tabular w-24 text-right text-[13px] text-muted">
                  {fmt(r.example)} → <strong className="text-brand-deep">{fmt(Math.round(r.example * r.r))}</strong>
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-line bg-brand-soft/50 px-5 py-4 md:px-7">
              <span className="text-[14px] font-semibold text-ink">Wallet to wallet</span>
              <span className="text-right text-[15px] font-bold text-brand-deep">Free</span>
              <span className="w-24 text-right text-[13px] text-muted">growth engine</span>
            </div>
            <p className="border-t border-line px-5 py-3 text-[12px] leading-5 text-muted md:px-7">
              Gross fees, before payment-processing costs. Examples in XAF. Unit economics and margins are in the deck.
            </p>
          </div>
        </Container>
      </section>

      {/* Moat */}
      <section className="bg-white py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Why LBPay wins</Eyebrow>
            <SectionTitle className="mt-4">
              Built to compound, <Accent>not just to process.</Accent>
            </SectionTitle>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {moats.map((m) => (
              <Feature key={m.title} icon={m.icon} title={m.title}>
                {m.copy}
              </Feature>
            ))}
          </div>
        </Container>
      </section>

      {/* Roadmap */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">Roadmap</Eyebrow>
            <SectionTitle className="mt-4">
              Where the next round <Accent>takes us.</Accent>
            </SectionTitle>
          </div>
          <ol className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              {
                when: "Now",
                tone: "bg-brand text-white",
                items: ["Wallet, savings, checkout and API live", "Bilingual product and support", "Verified-merchant program"],
              },
              {
                when: "Next",
                tone: "bg-ink text-white",
                items: [
                  "Formal company setup and payment licensing, directly or with a licensed partner",
                  "Merchant acquisition in Douala and Yaoundé",
                  "Webhook delivery and developer onboarding",
                ],
              },
              {
                when: "Then",
                tone: "bg-gold text-ink",
                items: [
                  "Open the cross-border corridors that are already built",
                  "Cards and recurring billing",
                  "Expansion across the CEMAC XAF zone",
                ],
              },
            ].map((col) => (
              <li key={col.when} className="rounded-[1.75rem] bg-white p-6 ring-1 ring-line">
                <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${col.tone}`}>{col.when}</span>
                <ul className="mt-5 space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex gap-3 text-[14px] leading-6 text-ink">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* The ask */}
      <section className="bg-white py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>The ask</Eyebrow>
            <SectionTitle className="mt-4">
              We&apos;re looking for partners, <Accent>not just capital.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              LBPay is early, and we say so plainly. The product works and people can use it today. Investment lets us
              formalize, license, and put it in front of every shop and phone in Cameroon.
            </Lead>
            <p className="mt-6 text-[15px] leading-7 text-muted">
              We share live numbers (sign-ups, payment volume, retention, savings balances) directly with serious
              investors, together with the deck and our plan for each franc raised.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              { icon: Handshake, title: "Investors", copy: "Angels and funds backing African fintech and financial inclusion." },
              { icon: ShieldCheck, title: "Licensing partners", copy: "Licensed institutions and aggregators we can operate with." },
              { icon: Users, title: "Distribution partners", copy: "Telcos, merchant networks and platforms that reach our customers." },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-[1.5rem] bg-paper p-5 ring-1 ring-line/60">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-deep ring-1 ring-line">
                  <c.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-ink">{c.title}</span>
                  <span className="block text-[14px] leading-6 text-muted">{c.copy}</span>
                </span>
              </div>
            ))}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <a
                href={mail("LBPay investor deck request")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white transition hover:bg-ink/90"
              >
                <FileText className="h-4 w-4" /> Request the deck
              </a>
              <a
                href={mail("Intro call with LBPay")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-ink ring-1 ring-line transition hover:ring-ink/20"
              >
                <Mail className="h-4 w-4" /> Email the team
              </a>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-brand-deep hover:underline"
            >
              {CONTACT_EMAIL} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Container>
      </section>

      <div className="pt-16">
        <CtaBand
          title={
            <>
              Help us build <Accent className="text-brand">money that feels at home.</Accent>
            </>
          }
          copy="One email gets you the deck, live numbers and a call with the people building LBPay."
          primary={{ href: mail("LBPay investor deck request"), label: "Request the deck" }}
          secondary={{ href: "/about", label: "Read our story" }}
        />
      </div>
    </div>
  );
}
