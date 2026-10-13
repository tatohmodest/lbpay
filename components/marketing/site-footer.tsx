import Link from "next/link";
import { Lock, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/logo";
import { Container } from "@/components/marketing/container";
import { CONTACT_EMAIL, LEGAL_NOTE, LEGAL_NOTE_FR } from "@/lib/flags";
import { getL } from "@/lib/i18n/server";

export async function SiteFooter() {
  const L = await getL();
  const columns = [
    {
      title: L("Products", "Produits"),
      links: [
        { href: "/products/wallet", label: L("Personal wallet", "Portefeuille personnel") },
        { href: "/products/business", label: L("Business checkout", "Paiement pour entreprises") },
        { href: "/products/developers", label: L("Payments API", "API de paiement") },
        { href: "/pricing", label: L("Pricing", "Tarifs") },
      ],
    },
    {
      title: L("Developers", "Développeurs"),
      links: [
        { href: "/docs", label: "Documentation" },
        { href: "/docs#payments", label: L("Create a payment", "Créer un paiement") },
        { href: "/docs#payouts", label: L("Payouts", "Décaissements") },
        { href: "/docs#sandbox", label: "Sandbox" },
      ],
    },
    {
      title: L("Company", "Entreprise"),
      links: [
        { href: "/about", label: L("About LBPay", "À propos de LBPay") },
        { href: "/investors", label: L("Investors", "Investisseurs") },
        { href: "/security", label: L("Security", "Sécurité") },
        { href: "/#faq", label: L("Help & FAQ", "Aide & FAQ") },
        { href: `mailto:${CONTACT_EMAIL}`, label: L("Contact us", "Nous contacter") },
      ],
    },
    {
      title: L("Legal", "Mentions légales"),
      links: [
        { href: "/privacy", label: L("Privacy policy", "Confidentialité") },
        { href: "/copyright", label: L("Copyright policy", "Droits d\'auteur") },
        { href: "/sitemap.xml", label: L("Sitemap", "Plan du site") },
      ],
    },
  ];
  return (
    <footer className="bg-forest text-white">
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="dark" />
          <p className="mt-5 max-w-xs text-[15px] leading-7 text-hero-muted">
            {L(
              "Money that feels at home. Send, save, and get paid in XAF, built in Cameroon for the way we already move money.",
              "Votre argent, enfin chez vous. Envoyez, épargnez et encaissez en XAF, avec une app conçue au Cameroun pour notre façon de payer.",
            )}
          </p>
          <div className="mt-6 space-y-2.5 text-sm text-white/70">
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2.5 transition hover:text-white">
              <Mail className="h-4 w-4 text-brand" /> {CONTACT_EMAIL}
            </a>
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-brand" /> Cameroon
            </p>
            <p className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-brand" /> {L("PIN on every payment", "PIN à chaque paiement")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-8">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/45">{col.title}</p>
              <ul className="mt-4 space-y-3 text-[14px]">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-white/75 transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-7 text-[12px] leading-5 text-white/45 md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="shrink-0">© {new Date().getFullYear()} LBPay · Looping Binary</p>
          <p className="max-w-2xl md:text-right">{L(LEGAL_NOTE, LEGAL_NOTE_FR)}</p>
        </Container>
      </div>
    </footer>
  );
}
