import Link from "next/link";
import { Lock, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/logo";
import { Container } from "@/components/marketing/container";
import { CONTACT_EMAIL, LEGAL_NOTE } from "@/lib/flags";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/products/wallet", label: "Personal wallet" },
      { href: "/products/business", label: "Business checkout" },
      { href: "/products/developers", label: "Payments API" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs#payments", label: "Create a payment" },
      { href: "/docs#payouts", label: "Payouts" },
      { href: "/docs#sandbox", label: "Sandbox" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About LBPay" },
      { href: "/investors", label: "Investors" },
      { href: "/security", label: "Security" },
      { href: "/#faq", label: "Help & FAQ" },
      { href: `mailto:${CONTACT_EMAIL}`, label: "Contact us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/copyright", label: "Copyright policy" },
      { href: "/sitemap.xml", label: "Sitemap" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-white">
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="dark" />
          <p className="mt-5 max-w-xs text-[15px] leading-7 text-hero-muted">
            Money that feels at home. Send, save, and get paid in XAF, built in Cameroon for the way we already move money.
          </p>
          <div className="mt-6 space-y-2.5 text-sm text-white/70">
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2.5 transition hover:text-white">
              <Mail className="h-4 w-4 text-brand" /> {CONTACT_EMAIL}
            </a>
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-brand" /> Cameroon
            </p>
            <p className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-brand" /> PIN on every payment
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
          <p className="max-w-2xl md:text-right">{LEGAL_NOTE}</p>
        </Container>
      </div>
    </footer>
  );
}
