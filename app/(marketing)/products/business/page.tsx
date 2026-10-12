import {
  BarChart3,
  BadgeCheck,
  FileText,
  Link2,
  QrCode,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { CheckoutCard, PaidNotice } from "@/components/marketing/mocks";
import { productMetadata } from "@/components/marketing/product-page";
import {
  Accent,
  ButtonLink,
  CheckList,
  CtaBand,
  Eyebrow,
  Feature,
  Lead,
  PageHero,
  SectionTitle,
} from "@/components/marketing/ui";
import { FEE_RATES, feePercent } from "@/lib/fees";
import { SHOP_LIMITS } from "@/lib/shop-limits";

export const metadata = productMetadata(
  "Business checkout for Cameroon",
  "Get paid with product links, a shop page and QR codes. Customers pay with MTN Mobile Money, Orange Money or LBPay wallet. You keep the full price.",
  "/products/business",
);

const features = [
  { icon: Link2, title: "Product links", copy: "One link per product, with photo and price. Paste it in any chat." },
  { icon: Store, title: "Your shop page", copy: "All your products on one page at your own address. Share it once." },
  { icon: QrCode, title: "QR at the counter", copy: "Print it, stick it, get paid. Customers scan with their phone." },
  { icon: FileText, title: "Invoices", copy: "Send a bill your customer can pay online, by Mobile Money or wallet." },
  { icon: Users, title: "Customers", copy: "See who bought, how often, and how much. No notebook needed." },
  { icon: BarChart3, title: "Sales & analytics", copy: "Today, this week, this month. Know what's selling." },
];

const products = [
  { e: "👗", n: "Kaba ngondo", p: "18 000" },
  { e: "👜", n: "Sac en raphia", p: "12 500" },
  { e: "🧴", n: "Beurre de karité", p: "3 500" },
  { e: "👡", n: "Sandales cuir", p: "9 000" },
];

const faqs = [
  {
    question: "Who can open a business account?",
    answer:
      "Anyone with an LBPay wallet. Apply from your profile with your business name and details. A person on our team reviews it, and once you're approved, your business tools unlock.",
  },
  {
    question: "What does it cost me to get paid?",
    answer: `Nothing is taken from your sale. If a customer pays with MTN or Orange, they pay a ${feePercent(FEE_RATES.deposit)}% fee shown at checkout. If they pay with an LBPay wallet, nobody pays a fee. Sending your earnings to Mobile Money costs ${feePercent(FEE_RATES.withdraw)}%.`,
  },
  {
    question: "Do my customers need LBPay?",
    answer:
      "No. They can pay from any MTN Mobile Money or Orange Money number. They just approve the payment on their phone.",
  },
  {
    question: "How many products can I list?",
    answer: `Your first ${SHOP_LIMITS.baseSlots} products are free. If you need more, add ${SHOP_LIMITS.packSize} more for ${SHOP_LIMITS.packPrice.toLocaleString("fr-FR")} XAF.`,
  },
];

export default function BusinessProductPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="LBPay for business"
        title={
          <>
            Sell anywhere. <Accent className="text-brand">Get paid everywhere.</Accent>
          </>
        }
        lead="Share a product link on WhatsApp, a shop page on Instagram, or a QR code at your counter. Customers pay with MTN, Orange or LBPay, and you keep the full price."
        actions={
          <>
            <ButtonLink href="/signup" arrow>
              Start selling
            </ButtonLink>
            <ButtonLink href="/pricing" variant="ghost-dark">
              See pricing
            </ButtonLink>
          </>
        }
        aside={
          <div className="relative mx-auto w-full max-w-[380px]">
            <CheckoutCard className="relative mx-auto" />
            <PaidNotice className="lb-float absolute -bottom-6 -left-10 hidden sm:flex" />
          </div>
        }
      />

      <section className="border-b border-line bg-white">
        <Container className="grid grid-cols-2 gap-px py-0 md:grid-cols-4">
          {[
            { k: "Kept from your sale", v: "100%" },
            { k: "Customer fee with wallet", v: "0 XAF" },
            { k: "Products free", v: String(SHOP_LIMITS.baseSlots) },
            { k: "Networks in one checkout", v: "3" },
          ].map((s) => (
            <div key={s.k} className="px-2 py-8 text-center">
              <p className="tabular text-3xl font-bold tracking-tight text-ink md:text-4xl">{s.v}</p>
              <p className="mt-1 text-[13px] text-muted">{s.k}</p>
            </div>
          ))}
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Your shop page</Eyebrow>
            <SectionTitle className="mt-4">
              A real shop, <Accent>in one link.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Add a photo and a price, and LBPay builds a page your customers can browse and pay from. No website,
              no developer, no monthly fee.
            </Lead>
            <CheckList
              className="mt-8"
              items={[
                "Your name, photo and verified badge at the top",
                "Customers pay without creating an account",
                "Every payment arrives with the product it was for",
              ]}
            />
          </div>
          <div className="rounded-[2rem] bg-forest p-5 md:p-8">
            <div className="rounded-[1.5rem] bg-paper p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-soft text-2xl">🌺</span>
                <div className="leading-tight">
                  <p className="flex items-center gap-1.5 font-bold text-ink">
                    Boutique Ndolo <BadgeCheck className="h-4 w-4 text-brand" />
                  </p>
                  <p className="text-[12px] text-muted">lbpay · /p/ndolo/shop</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <div key={p.n} className="rounded-2xl bg-white p-3 ring-1 ring-line">
                    <div className="grid aspect-[4/3] place-items-center rounded-xl bg-paper text-4xl">{p.e}</div>
                    <p className="mt-2.5 truncate text-[13px] font-semibold text-ink">{p.n}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="tabular text-[13px] font-bold text-ink">{p.p} XAF</p>
                      <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">Buy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Business tools</Eyebrow>
            <SectionTitle className="mt-4">
              Run the money side <Accent>of your business.</Accent>
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

      <section className="relative overflow-hidden bg-forest py-20 text-white lg:py-28">
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="max-w-2xl">
            <Eyebrow tone="dark">Getting started</Eyebrow>
            <SectionTitle className="mt-4">
              Open for business <Accent className="text-brand">this week.</Accent>
            </SectionTitle>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { t: "Open your wallet", d: "Sign up free with your email and phone, and set your PIN." },
              { t: "Apply for business", d: "Tell us about your business. A real person on our team reviews it." },
              { t: "Share and get paid", d: "Create links, print your QR, and watch payments arrive." },
            ].map((s, i) => (
              <li key={s.t} className="rounded-[1.5rem] bg-white/[0.05] p-7 ring-1 ring-white/10">
                <span className="font-display text-6xl italic leading-none text-brand">{i + 1}</span>
                <h3 className="mt-6 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/65">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <ButtonLink href="/signup" variant="white" arrow>
              Start selling
            </ButtonLink>
            <p className="flex items-center gap-2 text-[14px] text-white/60">
              <Wallet className="h-4 w-4 text-brand" /> Already on LBPay? Apply from your profile.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow>Merchant questions</Eyebrow>
            <SectionTitle className="mt-4">
              Straight <Accent>answers.</Accent>
            </SectionTitle>
          </div>
          <FaqAccordion items={faqs} />
        </Container>
      </section>

      <CtaBand
        title={
          <>
            Your customers are ready. <Accent className="text-brand">Are you?</Accent>
          </>
        }
        copy="Open your shop today. Keep the full price of every sale."
        primary={{ href: "/signup", label: "Start selling" }}
        secondary={{ href: "/products/developers", label: "Need an API?" }}
      />
    </div>
  );
}
