import {
  ArrowDownLeft,
  ArrowUpRight,
  AtSign,
  History,
  PiggyBank,
  QrCode,
  Send,
  Users,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SavingsShowcase } from "@/components/marketing/growth-sections";
import { ConfirmSheet, PhoneFrame, SentToast, WalletScreen } from "@/components/marketing/mocks";
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
import { SITE_FAQS } from "@/lib/site";

export const metadata = productMetadata(
  "Personal XAF wallet with an @handle",
  "A free XAF wallet for Cameroon. Send to an @handle or any MTN and Orange number, save with pots, and see every fee before you confirm with your PIN.",
  "/products/wallet",
);

const features = [
  { icon: Send, title: "Send to anyone", copy: "An @handle, an LBPay number, or any MTN and Orange phone." },
  { icon: Users, title: "Free between wallets", copy: "LBPay to LBPay is instant and costs nothing. Always." },
  { icon: ArrowDownLeft, title: "Request money", copy: "Share a link. They pay with Mobile Money or their wallet." },
  { icon: QrCode, title: "Get paid by QR", copy: "Show your code. Someone scans it, money lands in seconds." },
  { icon: PiggyBank, title: "Savings pots", copy: "Goals with streaks, auto-save, and a penalty that keeps you on track." },
  { icon: History, title: "Clear history", copy: "Every move with its fee, reference and status. Search and filter." },
];

const faqs = SITE_FAQS.filter((f) =>
  ["How much does LBPay cost?", "Is my money safe with LBPay?", "What happens if a transfer to Mobile Money fails?", "Can I send money from MTN to Orange with LBPay?"].includes(f.question),
);

export default function WalletProductPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="Personal wallet"
        title={
          <>
            Your money, <Accent className="text-brand">with your name on it.</Accent>
          </>
        }
        lead="A free XAF wallet with your own @handle. Send to anyone on MTN or Orange, get paid by QR, and save toward what matters, all protected by your PIN."
        actions={
          <>
            <ButtonLink href="/signup" arrow>
              Create my wallet
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost-dark">
              I have an account
            </ButtonLink>
          </>
        }
        aside={
          <div className="relative mx-auto w-fit">
            <div className="absolute -inset-10 rounded-full bg-brand/20 blur-3xl" />
            <PhoneFrame className="relative">
              <WalletScreen />
            </PhoneFrame>
            <SentToast className="lb-float absolute -left-20 bottom-28 hidden sm:flex" />
          </div>
        }
      />

      <section className="py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Everything in one wallet</Eyebrow>
            <SectionTitle className="mt-4">
              Everything you need. <Accent>Nothing you don&apos;t.</Accent>
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

      <section className="bg-white py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Your @handle</Eyebrow>
            <SectionTitle className="mt-4">
              No more &ldquo;send me your number <Accent>again?&rdquo;</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Pick a handle once and share it anywhere: your WhatsApp status, your shop sign, your email. People pay
              you without ever seeing your phone number.
            </Lead>
            <CheckList
              className="mt-8"
              items={[
                "Your phone number stays private",
                "Easy to say, impossible to mistype",
                "Works for money from MTN, Orange, or LBPay",
              ]}
            />
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-forest p-10 text-white md:p-14">
            <div className="lb-glow pointer-events-none absolute inset-0" />
            <div className="relative">
              <AtSign className="h-10 w-10 text-brand" />
              <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.16em] text-hero-muted">Pay me at</p>
              <p className="mt-2 break-all font-display text-6xl italic leading-none md:text-7xl">@ngono</p>
              <div className="mt-10 grid grid-cols-3 gap-2 text-center text-[12px]">
                {["WhatsApp", "Instagram", "Shop sign"].map((s) => (
                  <span key={s} className="rounded-xl bg-white/[0.07] px-2 py-2.5 ring-1 ring-white/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative">
              <div className="absolute -inset-8 rotate-3 rounded-[2.5rem] bg-brand-soft" />
              <ConfirmSheet className="relative" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Before every payment</Eyebrow>
            <SectionTitle className="mt-4">
              See it. Check it. <Accent>Then confirm.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              Before any money moves, LBPay shows who gets it, what they receive, the exact fee and your total. Only
              then do you enter your PIN. No surprises, ever.
            </Lead>
            <ol className="mt-8 space-y-4">
              {[
                { t: "Choose who", d: "@handle, LBPay number, or MTN and Orange phone." },
                { t: "Check the numbers", d: "Name, amount, fee, total. All on one screen." },
                { t: "Confirm with your PIN", d: "Only you can approve it. Then it's sent." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{s.t}</span>
                    <span className="block text-[15px] leading-7 text-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <Container>
          <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, k: "Wallet to wallet", v: "Free" },
              { icon: ArrowDownLeft, k: "Add money", v: `${feePercent(FEE_RATES.deposit)}%` },
              { icon: ArrowUpRight, k: "To MTN or Orange", v: `${feePercent(FEE_RATES.withdraw)}%` },
              { icon: PiggyBank, k: "Savings pots", v: "Free" },
            ].map((row) => (
              <div key={row.k} className="bg-white p-7">
                <row.icon className="h-5 w-5 text-brand-deep" />
                <p className="mt-5 text-[14px] text-muted">{row.k}</p>
                <p className="tabular mt-1 text-3xl font-bold tracking-tight text-ink">{row.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[14px] text-muted">
            Fees are added on top, so the person you pay gets the full amount.{" "}
            <a href="/pricing" className="font-semibold text-brand-deep hover:underline">
              See all pricing
            </a>
          </p>
        </Container>
      </section>

      <SavingsShowcase />

      <section className="bg-white py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <SectionTitle className="mt-4">
              Good to <Accent>know.</Accent>
            </SectionTitle>
          </div>
          <FaqAccordion items={faqs} />
        </Container>
      </section>

      <div className="pt-16">
        <CtaBand
          title={
            <>
              Two minutes to your <Accent className="text-brand">@handle.</Accent>
            </>
          }
          copy="Free to open. Free between wallets. Every fee shown before you pay."
          primary={{ href: "/signup", label: "Create my wallet" }}
        />
      </div>
    </div>
  );
}
