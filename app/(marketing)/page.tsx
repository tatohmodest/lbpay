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
import { SITE_DESCRIPTION, SITE_FAQS, SITE_FAQS_FR, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from "@/lib/site";
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

export default async function LandingPage() {
  const locale = await getRequestLocale();
  const t = (path: string) => translate(locale, path);
  const L = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const protections = [
    {
      icon: KeyRound,
      title: L("Your PIN on every payment", "Votre PIN à chaque paiement"),
      copy: L(
        "Nothing leaves your wallet without your 4-digit PIN. Four wrong tries and it locks.",
        "Rien ne sort de votre portefeuille sans votre PIN à 4 chiffres. Quatre erreurs et il se bloque.",
      ),
    },
    {
      icon: Fingerprint,
      title: L("Secrets we can't read", "Des secrets que nous ne pouvons pas lire"),
      copy: L(
        "Passwords and PINs are stored as salted scrypt hashes. Not even our team can see them.",
        "Mots de passe et PIN sont stockés sous forme de hachages scrypt salés. Même notre équipe ne peut pas les voir.",
      ),
    },
    {
      icon: FileCheck2,
      title: L("A ledger for every franc", "Un registre pour chaque franc"),
      copy: L(
        "Each movement is posted with its own reference, so your history always adds up.",
        "Chaque mouvement est enregistré avec sa propre référence : votre historique est toujours juste.",
      ),
    },
    {
      icon: RotateCcw,
      title: L("Automatic refunds", "Remboursements automatiques"),
      copy: L(
        "If MTN or Orange rejects a payout, the amount and the fee come back to you.",
        "Si MTN ou Orange refuse un retrait, le montant et les frais vous reviennent.",
      ),
    },
    {
      icon: TimerReset,
      title: L("Sessions that lock themselves", "Des sessions qui se verrouillent seules"),
      copy: L(
        "Leave LBPay open on the web and it signs out after 15 quiet minutes.",
        "Laissez LBPay ouvert sur le web : il vous déconnecte après 15 minutes d'inactivité.",
      ),
    },
    {
      icon: Eye,
      title: L("Limits until we know it's you", "Des plafonds tant que nous ne vous connaissons pas"),
      copy: L(
        "Outgoing transfers are capped at 500,000 XAF a day until your ID is verified.",
        "Les envois sont plafonnés à 500 000 XAF par jour jusqu'à la vérification de votre identité.",
      ),
    },
  ];

  const steps = [
    {
      n: "1",
      title: L("Create your account", "Créez votre compte"),
      copy: L(
        "Name, email, phone number. Confirm with the 6-digit code we email you. About two minutes.",
        "Nom, email, numéro de téléphone. Confirmez avec le code à 6 chiffres reçu par email. Environ deux minutes.",
      ),
    },
    {
      n: "2",
      title: L("Set your PIN", "Choisissez votre PIN"),
      copy: L(
        "Four digits that only you know. You'll use it every time money moves.",
        "Quatre chiffres que vous seul connaissez. Vous l'utiliserez à chaque mouvement d'argent.",
      ),
    },
    {
      n: "3",
      title: L("Send, save, get paid", "Envoyez, épargnez, encaissez"),
      copy: L(
        "Pick an @handle, add money from MTN or Orange, and you're ready.",
        "Choisissez un @identifiant, ajoutez de l'argent depuis MTN ou Orange, et c'est parti.",
      ),
    },
  ];

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
                <Lock className="h-3.5 w-3.5 text-brand" /> {L("PIN on every payment", "PIN à chaque paiement")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" /> {L("Fees shown before you pay", "Frais affichés avant de payer")}
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-brand" /> {L("Failed payouts refunded", "Retraits échoués remboursés")}
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
          <p className="text-[13px] font-medium text-muted">{L("Works with the money Cameroon already uses", "Fonctionne avec l'argent que le Cameroun utilise déjà")}</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { short: "MTN", label: "MTN Mobile Money", tone: "bg-mtn text-black" },
              { short: "OM", label: "Orange Money", tone: "bg-om text-white" },
              { short: "LB", label: L("LBPay wallet", "Portefeuille LBPay"), tone: "bg-brand text-white" },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-2.5 text-[14px] font-semibold text-ink">
                <span className={`grid h-7 w-7 place-items-center rounded-lg text-[8px] font-black ${r.tone}`}>
                  {r.short}
                </span>
                {r.label}
              </li>
            ))}
            <li className="text-[13px] font-medium text-muted">{L("Cards coming soon", "Cartes bientôt disponibles")}</li>
          </ul>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Products */}
      <section id="products" className="py-20 lg:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">{L("One account", "Un seul compte")}</Eyebrow>
            <SectionTitle className="mt-4">
              {L("Everything you do with money,", "Tout ce que vous faites avec votre argent,")}{" "}
              <Accent>{L("in one place.", "au même endroit.")}</Accent>
            </SectionTitle>
            <Lead className="mx-auto mt-5 max-w-xl">
              {L(
                "Start with a personal wallet. Open a shop when you're ready to sell. Build with the API when your product needs to take payments.",
                "Commencez avec un portefeuille personnel. Ouvrez une boutique quand vous êtes prêt à vendre. Utilisez l'API quand votre produit doit encaisser des paiements.",
              )}
            </Lead>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <ProductTile
              href="/products/wallet"
              icon={Wallet}
              eyebrow={L("Personal", "Particuliers")}
              title={L("Your XAF wallet, with your name on it.", "Votre portefeuille XAF, à votre nom.")}
              copy={L(
                "Send to an @handle or any MTN and Orange number. Request money, save toward goals, cash out.",
                "Envoyez à un @identifiant ou à tout numéro MTN et Orange. Demandez de l'argent, épargnez, retirez.",
              )}
              visual={
                <div className="lb-house-card mx-auto w-full max-w-[280px] rounded-2xl p-4 text-white">
                  <p className="text-[11px] text-white/75">@ngono · Wallet</p>
                  <p className="tabular mt-1 text-2xl font-bold">84 200 XAF</p>
                  <div className="mt-4 flex gap-1.5">
                    {[L("Send", "Envoyer"), L("Request", "Demander"), L("Save", "Épargner")].map((a) => (
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
              eyebrow={L("Business", "Entreprises")}
              title={L("Get paid by link, QR, or shop page.", "Encaissez par lien, QR ou page boutique.")}
              copy={L(
                "Share a product on WhatsApp. Customers pay with MTN, Orange, or wallet. You get one balance.",
                "Partagez un produit sur WhatsApp. Vos clients paient par MTN, Orange ou portefeuille. Un seul solde.",
              )}
              visual={
                <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-4 text-ink shadow-sm ring-1 ring-line">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-soft">👗</span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[12px] font-bold">Boutique Ndolo</p>
                      <p className="text-[10px] text-muted">{L("3 new payments today", "3 nouveaux paiements aujourd'hui")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2">
                    <span className="text-[11px] text-muted">{L("Today", "Aujourd'hui")}</span>
                    <span className="tabular text-[13px] font-bold">+ 46 500 XAF</span>
                  </div>
                </div>
              }
            />
            <ProductTile
              href="/products/developers"
              icon={Code2}
              eyebrow={L("Developers", "Développeurs")}
              title={L("A payments API that speaks XAF.", "Une API de paiement qui parle XAF.")}
              copy={L(
                "Collect and pay out on MTN and Orange with one integration. Sandbox first, live when verified.",
                "Encaissez et payez sur MTN et Orange avec une seule intégration. Sandbox d'abord, en production une fois vérifié.",
              )}
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
            <Eyebrow>{L("Pricing", "Tarifs")}</Eyebrow>
            <SectionTitle className="mt-4">
              {L("Fees on the wall,", "Des frais affichés,")} <Accent>{L("not in the fine print.", "pas cachés en petits caractères.")}</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              {L(
                "No monthly fee and no exchange-rate tricks. You see the fee and the total before you enter your PIN, and the person you pay always receives the full amount.",
                "Pas d'abonnement, pas d'astuces sur le taux. Vous voyez les frais et le total avant de saisir votre PIN, et la personne que vous payez reçoit toujours le montant complet.",
              )}
            </Lead>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
              {[
                { k: L("LBPay to LBPay", "LBPay vers LBPay"), v: L("Free", "Gratuit") },
                { k: L("Add money", "Ajouter de l'argent"), v: `${feePercent(FEE_RATES.deposit)}%` },
                { k: L("To MTN or Orange", "Vers MTN ou Orange"), v: `${feePercent(FEE_RATES.withdraw)}%` },
                { k: L("MTN ↔ Orange direct", "MTN ↔ Orange en direct"), v: `${feePercent(FEE_RATES.crossNetwork)}%` },
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
              {L("See full pricing and limits", "Voir tous les tarifs et plafonds")} <ArrowRight className="h-4 w-4" />
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
              <Eyebrow tone="dark">{L("Security", "Sécurité")}</Eyebrow>
              <SectionTitle className="mt-4">
                {L("Built to guard", "Conçu pour protéger")} <Accent className="text-brand">{L("every franc.", "chaque franc.")}</Accent>
              </SectionTitle>
            </div>
            <p className="max-w-lg text-[17px] leading-8 text-hero-muted">
              {L(
                "Trust isn't a badge we put on a page. It's a set of rules the app follows every single time money moves. Here are the ones that matter most.",
                "La confiance n'est pas un badge sur une page. C'est un ensemble de règles que l'app applique à chaque mouvement d'argent. Voici les plus importantes.",
              )}
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
              {L("How we protect your money", "Comment nous protégeons votre argent")}
            </ButtonLink>
            <p className="text-[14px] text-white/50">{L("Written in plain language, no jargon.", "En langage simple, sans jargon.")}</p>
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
            <Eyebrow>{L("For business", "Pour les entreprises")}</Eyebrow>
            <SectionTitle className="mt-4">
              {L("Your shop,", "Votre boutique,")} <Accent>{L("open everywhere", "ouverte partout")}</Accent>{" "}
              {L("your customers are.", "où sont vos clients.")}
            </SectionTitle>
            <Lead className="mt-5">
              {L(
                "Make a link for a product, a whole shop page, or a QR code for the counter. Customers pay from the phone in their hand. You see every payment arrive, with a record you can trust.",
                "Créez un lien pour un produit, une page boutique complète ou un QR code pour le comptoir. Vos clients paient depuis leur téléphone. Vous voyez chaque paiement arriver, avec une trace fiable.",
              )}
            </Lead>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/products/business" arrow>
                {L("Start selling", "Commencer à vendre")}
              </ButtonLink>
              <ButtonLink href="/products/developers" variant="secondary">
                {L("Use the API", "Utiliser l'API")}
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
              <Eyebrow>{L("Getting started", "Pour commencer")}</Eyebrow>
              <SectionTitle className="mt-4 max-w-xl">
                {L("Ready in", "Prêt en")} <Accent>{L("two minutes.", "deux minutes.")}</Accent>
              </SectionTitle>
            </div>
            <ButtonLink href="/signup" arrow className="self-start md:self-auto">
              {L("Open your free account", "Ouvrir un compte gratuit")}
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
            <Eyebrow tone="dark">{L("For developers", "Pour les développeurs")}</Eyebrow>
            <SectionTitle className="mt-4">
              {L("One integration.", "Une intégration.")} <Accent className="text-brand">{L("Both networks.", "Les deux réseaux.")}</Accent>
            </SectionTitle>
            <p className="mt-5 max-w-lg text-[17px] leading-8 text-hero-muted">
              {L(
                "Take payments and send payouts on MTN Mobile Money and Orange Money with a single REST API. Test everything in the sandbox. Go live once you're verified.",
                "Encaissez et envoyez des paiements sur MTN Mobile Money et Orange Money avec une seule API REST. Testez tout en sandbox. Passez en production une fois vérifié.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/docs" variant="white" arrow>
                {L("Read the docs", "Lire la documentation")}
              </ButtonLink>
              <ButtonLink href="/products/developers" variant="ghost-dark">
                {L("Developer platform", "Plateforme développeurs")}
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
            <Eyebrow>{L("Made in Cameroon", "Conçu au Cameroun")}</Eyebrow>
            <blockquote className="mt-6 text-balance text-[1.75rem] font-medium leading-[1.3] tracking-[-0.02em] text-ink md:text-[2.25rem]">
              <span className="font-display italic text-brand">&ldquo;</span>
              {L(
                "We built LBPay because sending money at home shouldn't mean guessing the fee, waiting on an agent, or wondering if it arrived.",
                "Nous avons créé LBPay parce qu'envoyer de l'argent chez nous ne devrait pas vouloir dire deviner les frais, attendre un agent ou se demander si l'argent est arrivé.",
              )}
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
                <span className="block text-[15px] font-semibold text-ink">{L("The LBPay team", "L'équipe LBPay")}</span>
                <span className="block text-[13px] text-muted">Looping Binary · Cameroon</span>
              </span>
            </figcaption>
          </figure>
          <div className="rounded-[1.75rem] bg-paper p-7 ring-1 ring-line/60">
            <p className="text-[15px] font-semibold text-ink">{L("Talk to us directly", "Parlez-nous directement")}</p>
            <p className="mt-2 text-[15px] leading-7 text-muted">
              {L(
                "Questions, a payment that looks wrong, or an idea? Write to the people who build the app.",
                "Une question, un paiement qui semble anormal, une idée ? Écrivez aux personnes qui construisent l'app.",
              )}
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
              {L("Read our story", "Lire notre histoire")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section id="faq" className="py-20 lg:py-28" aria-labelledby="faq-heading">
        <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow>{L("Help", "Aide")}</Eyebrow>
            <SectionTitle className="mt-4">
              <span id="faq-heading">
                {L("Questions,", "Vos questions,")} <Accent>{L("answered.", "nos réponses.")}</Accent>
              </span>
            </SectionTitle>
            <Lead className="mt-5">
              {L(
                "The honest answers to what people ask us most: fees, safety, and what happens when something goes wrong.",
                "Des réponses honnêtes aux questions les plus fréquentes : frais, sécurité, et ce qui se passe quand quelque chose ne va pas.",
              )}
            </Lead>
          </div>
          <FaqAccordion items={locale === "fr" ? SITE_FAQS_FR : SITE_FAQS} />
        </Container>
      </section>

      <CtaBand
        title={
          <>
            {L("Your money deserves a", "Votre argent mérite un")}{" "}
            <Accent className="text-brand">{L("home.", "chez-soi.")}</Accent>
          </>
        }
        copy={L(
          "Free to open, free between wallets, and every fee shown before you pay. Set up in two minutes.",
          "Ouverture gratuite, transferts gratuits entre portefeuilles, et chaque frais affiché avant de payer. Prêt en deux minutes.",
        )}
        primary={{ href: "/signup", label: L("Open your free account", "Ouvrir un compte gratuit") }}
        secondary={{ href: "/security", label: L("How we keep it safe", "Comment nous vous protégeons") }}
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
