import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/marketing/container";
import { LEGAL_NOTE } from "@/lib/flags";
import { SITE_TAGLINE } from "@/lib/site";

const product = [
  { href: "/products/wallet", label: "Personal wallet" },
  { href: "/products/business", label: "Business checkout" },
  { href: "/products/developers", label: "Payments API" },
  { href: "/docs", label: "Documentation" },
];

const developers = [
  { href: "/docs#payments", label: "Create a payment" },
  { href: "/docs#payouts", label: "Payouts" },
  { href: "/docs#sandbox", label: "Sandbox" },
  { href: "/docs#authentication", label: "API keys" },
];

const company = [
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Log in" },
  { href: "/#faq", label: "FAQ" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-[#eef3f0]">
      <Container className="grid gap-10 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{SITE_TAGLINE}.</p>
        </div>
        <nav aria-label="Product" className="md:col-span-2">
          <p className="text-xs font-semibold text-ink">Products</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-deep">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Developers" className="md:col-span-2">
          <p className="text-xs font-semibold text-ink">Developers</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {developers.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-deep">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account" className="md:col-span-3">
          <p className="text-xs font-semibold text-ink">Company</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {company.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-deep">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-line/80">
        <Container className="flex flex-col gap-2 py-6 text-xs leading-5 text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LBPay. Cameroon payments in XAF.</p>
          <p className="max-w-xl md:text-right">{LEGAL_NOTE}</p>
        </Container>
      </div>
    </footer>
  );
}
