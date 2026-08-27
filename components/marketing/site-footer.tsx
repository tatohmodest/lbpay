import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/marketing/container";
import { LEGAL_NOTE } from "@/lib/flags";
import { SITE_DESCRIPTION } from "@/lib/site";

const product = [
  { href: "/products/wallet", label: "Personal wallet" },
  { href: "/products/business", label: "Business checkout" },
  { href: "/products/developers", label: "Payments API" },
  { href: "/docs", label: "Documentation" },
];

const company = [
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Sign in" },
  { href: "/#faq", label: "FAQ" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-6 text-muted">{SITE_DESCRIPTION}</p>
        </div>
        <nav aria-label="Product">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Product</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink">
            {product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-deep">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Account</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink">
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
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-6 text-xs leading-5 text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LBPay. Cameroon payments in XAF.</p>
          <p className="max-w-xl md:text-right">{LEGAL_NOTE}</p>
        </Container>
      </div>
    </footer>
  );
}
