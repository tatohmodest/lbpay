import { BookOpen, FlaskConical, KeyRound, Link2, ScrollText, Send, Wallet, Webhook } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { ApiConsole } from "@/components/marketing/mocks";
import { productMetadata } from "@/components/marketing/product-page";
import {
  Accent,
  ButtonLink,
  CtaBand,
  Eyebrow,
  Feature,
  Lead,
  PageHero,
  SectionTitle,
} from "@/components/marketing/ui";

export const metadata = productMetadata(
  "Payments API for Cameroon",
  "Collect and pay out on MTN Mobile Money and Orange Money with one REST API. Free sandbox, webhooks, payment links and logs. Live keys after verification.",
  "/products/developers",
);

const endpoints = [
  { method: "POST", path: "/v1/payments", what: "Collect from MTN, Orange or wallet" },
  { method: "POST", path: "/v1/payouts", what: "Send to any Mobile Money number" },
  { method: "POST", path: "/v1/payment-links", what: "Create a hosted payment page" },
  { method: "GET", path: "/v1/balance", what: "Read your available balance" },
];

const features = [
  { icon: FlaskConical, title: "Free sandbox", copy: "Test keys work the moment you apply and never touch real money." },
  { icon: KeyRound, title: "Secret keys, stored hashed", copy: "Bearer authentication. We keep only a hash of your secret." },
  { icon: Webhook, title: "Webhooks", copy: "Register endpoints for payment.succeeded and payment.failed. Event delivery is rolling out." },
  { icon: ScrollText, title: "Request logs", copy: "See every call your app made, with status, in your console." },
  { icon: Link2, title: "Hosted payment links", copy: "No checkout to build. Create a link and send customers there." },
  { icon: Send, title: "Payouts", copy: "Pay suppliers, staff or customers straight to Mobile Money." },
];

const scenarios = [
  { amount: "5 000", ends: "any other", result: "succeeded", tone: "bg-brand-soft text-brand-deep" },
  { amount: "5 013", ends: "…13", result: "failed", tone: "bg-[#fdecea] text-danger" },
  { amount: "5 077", ends: "…77", result: "pending", tone: "bg-gold-soft text-[#7a5a1c]" },
];

export default function DevelopersProductPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="LBPay for developers"
        title={
          <>
            Mobile Money payments, <Accent className="text-brand">one API.</Accent>
          </>
        }
        lead="Collect and pay out on MTN Mobile Money and Orange Money with a single REST integration. Build in the sandbox today, go live once you're verified."
        actions={
          <>
            <ButtonLink href="/signup" arrow>
              Get sandbox keys
            </ButtonLink>
            <ButtonLink href="/docs" variant="ghost-dark">
              <BookOpen className="h-4 w-4" /> Read the docs
            </ButtonLink>
          </>
        }
        aside={<ApiConsole />}
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Eyebrow>The API</Eyebrow>
            <SectionTitle className="mt-4">
              Small surface. <Accent>Everything you need.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Four endpoints cover what most products need. Amounts are whole XAF, responses are plain
              JSON.
            </Lead>
            <div className="mt-8">
              <ButtonLink href="/docs" variant="secondary" arrow>
                Full reference
              </ButtonLink>
            </div>
          </div>
          <ul className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-line">
            {endpoints.map((e, i) => (
              <li
                key={e.path}
                className={`flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-center sm:gap-5 md:px-7 ${i ? "border-t border-line" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-12 rounded-md py-1 text-center font-mono text-[11px] font-bold ${e.method === "GET" ? "bg-[#e8f0ff] text-[#2a4fa8]" : "bg-brand-soft text-brand-deep"}`}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-[14px] font-semibold text-ink">{e.path}</code>
                </span>
                <span className="text-[14px] text-muted sm:ml-auto">{e.what}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Platform</Eyebrow>
            <SectionTitle className="mt-4">
              Built for builders <Accent>who ship.</Accent>
            </SectionTitle>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Feature key={f.title} icon={f.icon} title={f.title}>
                {f.copy}
              </Feature>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Sandbox</Eyebrow>
            <SectionTitle className="mt-4">
              Test every outcome <Accent>before it&apos;s real.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              The last two digits of the amount decide what happens in the sandbox, so you can build your success,
              failure and waiting screens with confidence.
            </Lead>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-line">
            <div className="grid grid-cols-3 bg-paper px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted md:px-7">
              <span>Amount</span>
              <span>Ends in</span>
              <span className="text-right">Result</span>
            </div>
            {scenarios.map((s) => (
              <div key={s.result} className="grid grid-cols-3 items-center border-t border-line px-5 py-4 md:px-7">
                <span className="tabular font-mono text-[15px] font-semibold text-ink">{s.amount}</span>
                <span className="font-mono text-[14px] text-muted">{s.ends}</span>
                <span className="text-right">
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold ${s.tone}`}>
                    {s.result}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-forest py-20 text-white lg:py-28">
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="max-w-2xl">
            <Eyebrow tone="dark">Going live</Eyebrow>
            <SectionTitle className="mt-4">
              From first call <Accent className="text-brand">to first franc.</Accent>
            </SectionTitle>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: Wallet, t: "Open a wallet", d: "Free, two minutes. Your balance is where payments land." },
              { icon: FlaskConical, t: "Apply as a developer", d: "From your profile. Sandbox keys appear right away." },
              { icon: KeyRound, t: "Verify and go live", d: "Once you're verified, live keys unlock real payments." },
            ].map((s, i) => (
              <li key={s.t} className="rounded-[1.5rem] bg-white/[0.05] p-7 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <s.icon className="h-6 w-6 text-brand" />
                  <span className="font-mono text-[12px] text-white/40">0{i + 1}</span>
                </div>
                <h3 className="mt-8 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/65">{s.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <div className="pt-16 lg:pt-20">
        <CtaBand
          title={
            <>
              Your first payment is <Accent className="text-brand">one request away.</Accent>
            </>
          }
          copy="Sandbox access is free and instant. No sales call, no paperwork to start."
          primary={{ href: "/signup", label: "Get sandbox keys" }}
          secondary={{ href: "/docs", label: "Read the docs" }}
        />
      </div>
    </div>
  );
}
