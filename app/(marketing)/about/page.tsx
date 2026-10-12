import { ArrowRight, Eye, Heart, Languages, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { productMetadata } from "@/components/marketing/product-page";
import { Accent, CtaBand, Eyebrow, Feature, Lead, PageHero, SectionTitle } from "@/components/marketing/ui";
import { CONTACT_EMAIL, FEATURES } from "@/lib/flags";

export const metadata = productMetadata(
  "About LBPay",
  "LBPay is a payments app built in Cameroon by Looping Binary. Why we built it, what we believe, and what's live today.",
  "/about",
);

const principles = [
  {
    icon: Eye,
    title: "Show the fee. Always.",
    copy: "If we can't show you the exact cost before you confirm, we don't ship it. No margins hidden in a rate.",
  },
  {
    icon: ShieldCheck,
    title: "Your PIN, your money.",
    copy: "Nothing moves without you. Every payment, every withdrawal, every time.",
  },
  {
    icon: Languages,
    title: "Plain words, two languages.",
    copy: "English and French, written so anyone can understand what just happened to their money.",
  },
  {
    icon: MapPin,
    title: "Built for here.",
    copy: "MTN and Orange, XAF, njangi-style saving, WhatsApp selling. We design for how Cameroon already works.",
  },
];

const live = [
  "XAF wallet with your own @handle",
  "Add money from and send to MTN and Orange",
  "Free LBPay to LBPay transfers",
  "Savings pots with streaks and auto-save",
  "Shop pages, product links and QR for businesses",
  "Payments API with sandbox and webhooks",
];

const next = [
  ...(FEATURES.international ? [] : ["Transfers to 9 more African countries"]),
  "Card payments",
  "Recurring billing for businesses",
];

export default function AboutPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="About us"
        title={
          <>
            Built in Cameroon, <Accent className="text-brand">for how we move money.</Accent>
          </>
        }
        lead="LBPay is made by Looping Binary, a software team in Cameroon. We're building the payments app we always wanted for our families, our friends, and the businesses on our street."
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Eyebrow>Why LBPay</Eyebrow>
            <SectionTitle className="mt-4">
              Money at home <Accent>shouldn&apos;t be hard.</Accent>
            </SectionTitle>
          </div>
          <div className="space-y-6 text-[17px] leading-8 text-ink/80">
            <p>
              In Cameroon, almost everyone has Mobile Money. But MTN and Orange are two separate worlds. Sending
              between them means finding an agent, guessing the fee, and hoping the money arrives.
            </p>
            <p>
              Small businesses take payments on three phones and reconcile in a notebook. Saving is a promise to
              yourself that&apos;s easy to break. And developers who want to accept payments have to integrate every
              network on their own.
            </p>
            <p className="font-medium text-ink">
              LBPay puts it all in one place: one wallet, one @handle, both networks, and every fee shown before you
              pay. Simple enough for your mother, solid enough for your business.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>What we believe</Eyebrow>
            <SectionTitle className="mt-4">
              Four promises <Accent>we build by.</Accent>
            </SectionTitle>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <Feature key={p.title} icon={p.icon} title={p.title}>
                {p.copy}
              </Feature>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">Where we are</Eyebrow>
            <SectionTitle className="mt-4">
              Honest about <Accent>today.</Accent> Excited about tomorrow.
            </SectionTitle>
            <Lead className="mx-auto mt-5">
              LBPay is young, and we&apos;d rather tell you exactly what works than promise what doesn&apos;t yet.
            </Lead>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] bg-white p-7 ring-1 ring-line">
              <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                <span className="lb-live-dot h-2 w-2 rounded-full bg-brand" /> Live today
              </p>
              <ul className="mt-5 space-y-3">
                {live.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-ink">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.75rem] bg-forest p-7 text-white">
              <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-gold">
                <Sparkles className="h-4 w-4" /> Coming next
              </p>
              <ul className="mt-5 space-y-3">
                {next.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-white/85">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-6 text-hero-muted">
                Want something on this list sooner? Tell us. Your messages shape what we build next.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <Container className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Heart,
              title: "Users",
              copy: "A question, a payment that looks wrong, or an idea. We read every message.",
              cta: "Write to us",
              subject: "Hello%20LBPay",
            },
            {
              icon: Sparkles,
              title: "Partners & investors",
              copy: "Building payments for Cameroon is a big job. If you want to help us do it, let's talk.",
              cta: "Start a conversation",
              subject: "Partnership%20%2F%20investment",
            },
            {
              icon: ShieldCheck,
              title: "Press & security",
              copy: "Media questions or a security report. We'll get back to you quickly.",
              cta: "Get in touch",
              subject: "Press%20or%20security",
            },
          ].map((c) => (
            <a
              key={c.title}
              href={`mailto:${CONTACT_EMAIL}?subject=${c.subject}`}
              className="group flex flex-col rounded-[1.75rem] bg-paper p-7 ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:ring-brand/40"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-deep ring-1 ring-line">
                <c.icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{c.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-7 text-muted">{c.copy}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-deep">
                {c.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </Container>
      </section>

      <div className="pt-16">
        <CtaBand
          title={
            <>
              Come home to <Accent className="text-brand">LBPay.</Accent>
            </>
          }
          copy="Free to open, free between wallets, and built by people who use it themselves."
        />
      </div>
    </div>
  );
}
