import { Check, Minus } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeeCalculator } from "@/components/marketing/fee-calculator";
import { productMetadata } from "@/components/marketing/product-page";
import { Accent, CtaBand, Eyebrow, Lead, PageHero, SectionTitle } from "@/components/marketing/ui";
import { FEE_RATES, feePercent } from "@/lib/fees";
import { LIMITS } from "@/lib/limits";
import { SAVINGS } from "@/lib/savings";
import { INTERNATIONAL } from "@/lib/countries";
import { FEATURES } from "@/lib/flags";

export const metadata = productMetadata(
  "Pricing and fees",
  "Every LBPay fee in plain numbers. Free wallet transfers, 1.5% to add money, 2.5% to Mobile Money. No monthly fee, no hidden exchange margin.",
  "/pricing",
);

const fmt = (n: number) => n.toLocaleString("fr-FR");
const pct = (r: number) => `${feePercent(r)}%`;

const personal = [
  { what: "Open an account", fee: "Free", note: "No monthly or yearly fee, ever." },
  { what: "LBPay to LBPay", fee: "Free", note: "To any @handle or LBPay number. Instant." },
  { what: "Add money from MTN or Orange", fee: pct(FEE_RATES.deposit), note: `From ${fmt(LIMITS.depositMin)} XAF.` },
  {
    what: "Send to an MTN or Orange number",
    fee: pct(FEE_RATES.withdraw),
    note: `${fmt(LIMITS.momoOutMin)} to ${fmt(LIMITS.momoOutMax)} XAF per transfer.`,
  },
  { what: "Direct MTN ↔ Orange transfer", fee: pct(FEE_RATES.crossNetwork), note: "No wallet balance needed." },
  {
    what: "Savings pots",
    fee: "Free",
    note: `Free at your goal. The fee you pick (${Math.round(SAVINGS.minPenaltyRate * 100)}–${Math.round(SAVINGS.maxPenaltyRate * 100)}%) applies only if you miss a save or withdraw before the goal.`,
  },
  {
    what: "Send abroad",
    fee: pct(INTERNATIONAL.feeRate),
    note: FEATURES.international ? "Rate locked when you confirm." : "Opening soon. Rate locked when you confirm.",
  },
];

const business = [
  { what: "Shop page, product links and QR", fee: "Free", note: "Your first 20 products are free. Need more? 2 000 XAF per 10 extra." },
  { what: "Customer pays with LBPay wallet", fee: "Free", note: "For you and for them." },
  {
    what: "Customer pays with MTN or Orange",
    fee: `${pct(FEE_RATES.deposit)} to customer`,
    note: "Shown to the customer at checkout. You receive the full price.",
  },
  { what: "Pay out to Mobile Money", fee: pct(FEE_RATES.withdraw), note: "Same rate as personal." },
  { what: "API payouts", fee: pct(FEE_RATES.withdraw), note: "Sandbox is always free." },
];

const limits = [
  { what: "Smallest wallet transfer or deposit", value: `${fmt(LIMITS.walletTransferMin)} XAF` },
  { what: "Smallest Mobile Money payout", value: `${fmt(LIMITS.momoOutMin)} XAF` },
  { what: "Largest Mobile Money payout", value: `${fmt(LIMITS.momoOutMax)} XAF` },
  { what: "Daily outgoing, before ID check", value: `${fmt(LIMITS.kycLevel1Daily)} XAF` },
  { what: "Daily outgoing, after ID check", value: "Raised" },
];

const pricingFaqs = [
  {
    question: "Who pays the fee, me or the person I send to?",
    answer:
      "You do, and it's added on top. If you send 10,000 XAF to Mobile Money, they receive 10,000 XAF and you pay 10,250 XAF. You always see the total before you enter your PIN.",
  },
  {
    question: "Are there exchange-rate margins or hidden charges?",
    answer:
      "No. Everything in Cameroon is in XAF, so there is no conversion. For transfers abroad, the fee is the flat rate shown here and your rate is locked the moment you confirm.",
  },
  {
    question: "What if a payout fails?",
    answer:
      "If MTN or Orange rejects it, LBPay puts the amount and the fee back in your wallet automatically. Both entries appear in your history.",
  },
  {
    question: "Will prices change?",
    answer:
      "If they ever change, this page is updated first, and the app always shows the exact fee before you confirm. A fee you've already paid never changes afterwards.",
  },
];

function Table({ rows }: { rows: { what: string; fee: string; note: string }[] }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-line">
      {rows.map((row, i) => (
        <div
          key={row.what}
          className={`grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 md:px-7 md:py-5 ${i ? "border-t border-line" : ""}`}
        >
          <div>
            <p className="text-[15px] font-semibold text-ink">{row.what}</p>
            <p className="mt-0.5 text-[13px] leading-5 text-muted">{row.note}</p>
          </div>
          <p
            className={`tabular text-left text-lg font-bold sm:text-right ${row.fee === "Free" ? "text-brand-deep" : "text-ink"}`}
          >
            {row.fee}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Simple fees. <Accent className="text-brand">Shown up front.</Accent>
          </>
        }
        lead="No subscriptions, no monthly charges, no surprises in the exchange rate. You see the fee and the total before you confirm, every single time."
        aside={<FeeCalculator />}
      />

      <section className="py-20 lg:py-24">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-12">
          <div>
            <Eyebrow>Personal</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink md:text-3xl">For everyday money</h2>
            <div className="mt-6">
              <Table rows={personal} />
            </div>
          </div>
          <div>
            <Eyebrow>Business & developers</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink md:text-3xl">For getting paid</h2>
            <div className="mt-6">
              <Table rows={business} />
            </div>
            <div className="mt-6 rounded-[1.5rem] bg-forest p-6 text-white">
              <p className="text-[15px] font-semibold">You keep the full price.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-hero-muted">
                When a customer pays 10,000 XAF for your product, 10,000 XAF lands in your balance. No commission is
                taken from your sale.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Eyebrow>Limits</Eyebrow>
            <SectionTitle className="mt-4">
              Limits that <Accent>protect you.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Daily caps stop the worst from happening if someone ever gets hold of your phone. Verify your ID in the
              app and they go up.
            </Lead>
          </div>
          <dl className="overflow-hidden rounded-[1.5rem] ring-1 ring-line">
            {limits.map((row, i) => (
              <div
                key={row.what}
                className={`flex items-center justify-between gap-6 px-5 py-4 md:px-7 ${i ? "border-t border-line" : ""}`}
              >
                <dt className="text-[15px] text-muted">{row.what}</dt>
                <dd className="tabular text-[15px] font-bold text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">Always free</Eyebrow>
            <SectionTitle className="mt-4">
              What you&apos;ll <Accent>never</Accent> pay for
            </SectionTitle>
          </div>
          <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "A monthly or yearly account fee",
              "Receiving money into your wallet",
              "Sending to another LBPay wallet",
              "A hidden exchange-rate margin",
              "Opening a shop or payment link",
              "Using the developer sandbox",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-[15px] font-medium text-ink ring-1 ring-line">
                <Mark on={false} />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow>Pricing questions</Eyebrow>
            <SectionTitle className="mt-4">
              No small print. <Accent>Promise.</Accent>
            </SectionTitle>
          </div>
          <FaqAccordion items={pricingFaqs} />
        </Container>
      </section>

      <div className="pt-16">
        <CtaBand
          title={
            <>
              Free to open. <Accent className="text-brand">Free to try.</Accent>
            </>
          }
          copy="Create your account, send your first transfer to a friend on LBPay, and pay nothing."
        />
      </div>
    </div>
  );
}

function Mark({ on, brand = false }: { on: boolean; brand?: boolean }) {
  return on ? (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full ${brand ? "bg-brand text-white" : "bg-paper text-ink"}`}
      aria-label="Yes"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-paper text-muted" aria-label="No">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}
