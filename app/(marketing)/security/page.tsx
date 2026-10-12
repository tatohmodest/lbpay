import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Eye,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  RotateCcw,
  Server,
  ShieldCheck,
  Smartphone,
  TimerReset,
  UserCheck,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { productMetadata } from "@/components/marketing/product-page";
import { Accent, CtaBand, Eyebrow, Feature, Lead, PageHero, SectionTitle } from "@/components/marketing/ui";
import { CONTACT_EMAIL } from "@/lib/flags";
import { LIMITS } from "@/lib/limits";

export const metadata = productMetadata(
  "Security: how LBPay protects your money",
  "PIN on every payment, salted password hashing, a ledger for every movement, automatic refunds and daily limits. How LBPay keeps your money and data safe.",
  "/security",
);

const fmt = (n: number) => n.toLocaleString("fr-FR");

const layers = [
  {
    id: "account",
    eyebrow: "Your account",
    title: "Only you can get in.",
    items: [
      {
        icon: MailCheck,
        title: "Verified email",
        copy: "Every new account confirms its email with a 6-digit code before it can move money.",
      },
      {
        icon: KeyRound,
        title: "Password and PIN",
        copy: "Sign in with your password, then your 4-digit PIN. Two different things you know.",
      },
      {
        icon: Fingerprint,
        title: "Stored so no one can read them",
        copy: "Passwords and PINs are kept as salted scrypt hashes. Even with full database access, nobody can see them.",
      },
      {
        icon: Lock,
        title: "Lockout on wrong guesses",
        copy: "Four wrong PIN attempts lock your PIN for a while, so it can't be guessed.",
      },
      {
        icon: TimerReset,
        title: "Sessions that close themselves",
        copy: "On the web, LBPay signs you out after 15 quiet minutes. In the app, coming back asks for your PIN.",
      },
      {
        icon: Smartphone,
        title: "Secure cookies",
        copy: "Your session lives in an HTTP-only cookie that page scripts can't read, sent only over HTTPS.",
      },
    ],
  },
  {
    id: "money",
    eyebrow: "Your money",
    title: "Every franc is accounted for.",
    items: [
      {
        icon: ShieldCheck,
        title: "Your PIN on every payment",
        copy: "Sending, withdrawing and paying all need your PIN. No exceptions, no saved approvals.",
      },
      {
        icon: FileCheck2,
        title: "A ledger entry for each move",
        copy: "Every movement is recorded with its own reference, amount, fee and status, so your history always adds up.",
      },
      {
        icon: RotateCcw,
        title: "Automatic, one-time refunds",
        copy: "If MTN or Orange rejects a payout, the amount and fee return to your wallet, exactly once, never twice.",
      },
      {
        icon: Eye,
        title: "Fees before you confirm",
        copy: "The fee and the total are on screen before you enter your PIN. What you see is what you pay.",
      },
      {
        icon: AlertTriangle,
        title: "Daily limits",
        copy: `Until your ID is verified, outgoing transfers are capped at ${fmt(LIMITS.kycLevel1Daily)} XAF a day, and each Mobile Money payout at ${fmt(LIMITS.momoOutMax)} XAF.`,
      },
      {
        icon: Server,
        title: "Established payment networks",
        copy: "Mobile Money payments run on the MTN Mobile Money and Orange Money networks through our payment processing partner.",
      },
    ],
  },
  {
    id: "team",
    eyebrow: "Our side",
    title: "Rules for us, too.",
    items: [
      {
        icon: UserCheck,
        title: "Verified businesses",
        copy: "Business accounts are reviewed by a person before they can collect payments from the public.",
      },
      {
        icon: BadgeCheck,
        title: "Fresh code for staff access",
        copy: "Our operations console asks for a new one-time email code every time someone on the team opens it.",
      },
      {
        icon: ClipboardList,
        title: "Every staff action is logged",
        copy: "Freezes, corrections and reviews are written to an audit log with who did it and when.",
      },
      {
        icon: KeyRound,
        title: "API secrets stored hashed",
        copy: "Developer secret keys are stored as hashes. Sandbox keys can never move real money.",
      },
    ],
  },
];

const dos = [
  "LBPay will never ask for your PIN, password or email code by phone, SMS or WhatsApp.",
  "Only enter your PIN inside the LBPay app or on the lbpay website you opened yourself.",
  "Check the name and the total on the confirm screen before you enter your PIN.",
  "If something looks wrong, contact us right away so we can freeze the account while we check.",
];

export default function SecurityPage() {
  return (
    <div className="bg-paper">
      <PageHero
        eyebrow="Security"
        title={
          <>
            Your money is safe here. <Accent className="text-brand">Here&apos;s exactly why.</Accent>
          </>
        }
        lead="No vague promises and no badges. These are the actual rules LBPay follows, written in plain language so you can check them yourself."
        aside={
          <div className="mx-auto w-full max-w-md space-y-3">
            {[
              { icon: KeyRound, t: "PIN required", d: "for every payment" },
              { icon: Fingerprint, t: "Salted scrypt", d: "for passwords and PINs" },
              { icon: RotateCcw, t: "Automatic refund", d: "if a payout fails" },
              { icon: TimerReset, t: "15-minute lock", d: "for idle web sessions" },
            ].map((row, i) => (
              <div
                key={row.t}
                className="lb-rise flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
                  <row.icon className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[15px] font-semibold text-white">{row.t}</span>
                  <span className="block text-[13px] text-hero-muted">{row.d}</span>
                </span>
                <BadgeCheck className="ml-auto h-5 w-5 text-brand" />
              </div>
            ))}
          </div>
        }
      />

      <nav aria-label="On this page" className="sticky top-[var(--header-h)] z-30 border-b border-line bg-paper/90 backdrop-blur">
        <Container className="flex gap-1 overflow-x-auto py-3">
          {layers.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-muted transition hover:bg-white hover:text-ink"
            >
              {l.eyebrow}
            </a>
          ))}
          <a
            href="#you"
            className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-muted transition hover:bg-white hover:text-ink"
          >
            Your part
          </a>
          <a
            href="#report"
            className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-muted transition hover:bg-white hover:text-ink"
          >
            Report a problem
          </a>
        </Container>
      </nav>

      {layers.map((layer, i) => (
        <section key={layer.id} id={layer.id} className={i % 2 ? "bg-white py-20 lg:py-24" : "py-20 lg:py-24"}>
          <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <Eyebrow>{layer.eyebrow}</Eyebrow>
              <SectionTitle className="mt-4">{layer.title}</SectionTitle>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {layer.items.map((item) => (
                <Feature key={item.title} icon={item.icon} title={item.title}>
                  {item.copy}
                </Feature>
              ))}
            </div>
          </Container>
        </section>
      ))}

      <section id="you" className="relative overflow-hidden bg-forest py-20 text-white lg:py-24">
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <Container className="relative grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <Eyebrow tone="dark">Your part</Eyebrow>
            <SectionTitle className="mt-4">
              The one rule <Accent className="text-brand">that beats every scam.</Accent>
            </SectionTitle>
            <p className="mt-5 text-[17px] leading-8 text-hero-muted">
              Your PIN is yours alone. Nobody from LBPay will ever ask for it.
            </p>
          </div>
          <ol className="space-y-3">
            {dos.map((d, i) => (
              <li key={d} className="flex gap-4 rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10">
                <span className="font-display text-3xl italic leading-none text-brand">{i + 1}</span>
                <span className="text-[16px] leading-7 text-white/85">{d}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="report" className="py-20 lg:py-24">
        <Container className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.75rem] bg-white p-8 ring-1 ring-line">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fdecea] text-danger">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-ink">Something wrong with your account?</h2>
            <Lead className="mt-2 text-[15px] leading-7">
              A payment you don&apos;t recognise, a lost phone, or a message pretending to be us. Open Support in the
              app or email us. Tell us your @handle, never your PIN.
            </Lead>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Account%20security`}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              <Mail className="h-4 w-4" /> Contact security
            </a>
          </div>
          <div className="rounded-[1.75rem] bg-white p-8 ring-1 ring-line">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-deep">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-ink">Found a vulnerability?</h2>
            <Lead className="mt-2 text-[15px] leading-7">
              We welcome reports from security researchers. Send the details privately, give us reasonable time to
              fix it, and don&apos;t access other people&apos;s data. We&apos;ll reply and credit you if you&apos;d
              like.
            </Lead>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Vulnerability%20report`}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:ring-ink/20"
            >
              <Mail className="h-4 w-4" /> Report responsibly
            </a>
          </div>
        </Container>
      </section>

      <CtaBand
        title={
          <>
            Safe by design. <Accent className="text-brand">Simple by choice.</Accent>
          </>
        }
        copy="Open your free account and see every rule above working for you."
        secondary={{ href: "/privacy", label: "Read our privacy policy" }}
      />
    </div>
  );
}
