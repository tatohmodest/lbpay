import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Link2,
  QrCode,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
          <Link href="#products" className="hover:text-brand">
            Products
          </Link>
          <Link href="/docs" className="hover:text-brand">
            Docs
          </Link>
          <Link href="/login" className="hover:text-brand">
            Sign in
          </Link>
        </nav>
        <Link href="/signup">
          <Button size="sm">Open wallet</Button>
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Cameroon payment infrastructure
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink md:text-6xl">
            Move money. Receive money. Build on money.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            LBPay is the platform people, businesses, and developers use. MTN, Orange,
            cards, and the LBPay wallet sit underneath as rails — not the product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg">
                Create your wallet <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="secondary">
                Read the API
              </Button>
            </Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Designed for XAF, Mobile Money, and developer-grade ledgers.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-line shadow-[0_20px_60px_rgba(0,179,105,0.12)]">
          <Image
            src="/illustrations/hero-send-money.png"
            alt="People sending money with LBPay"
            width={1536}
            height={1024}
            className="h-auto w-full"
            priority
          />
        </div>
      </section>

      <section id="products" className="bg-paper py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3 md:px-8">
          {[
            {
              icon: Wallet,
              title: "Wallet",
              copy: "Personal accounts with @handles, deposits, withdrawals, airtime, bills, and instant LBPay transfers.",
              href: "/wallet",
            },
            {
              icon: Store,
              title: "Business",
              copy: "Accept MTN, Orange, cards, wallet, payment links, and QR — without stitching networks together.",
              href: "/business",
            },
            {
              icon: Code2,
              title: "Developers",
              copy: "Keys, sandbox, webhooks, payouts, subscriptions, and SDKs. Infrastructure, not a wrapper.",
              href: "/developers",
            },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
              <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
                Open {item.title} <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
        <Image
          src="/illustrations/cross-network.png"
          alt="MTN to Orange through LBPay"
          width={1536}
          height={1024}
          className="h-auto w-full rounded-[2rem] border border-line"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Killer consumer feature
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">MTN → Orange. One send.</h2>
          <p className="mt-4 text-muted">
            Users should not think in networks. They send 20,000 XAF to a number or an
            @handle. LBPay chooses the rail, posts the ledger, and settles out when money
            has to leave the platform.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink">
            <li>Send to @modest instead of a phone number</li>
            <li>Internal LBPay → LBPay transfers stay on the ledger</li>
            <li>Request money, split bills, and share payment links</li>
          </ul>
        </div>
      </section>

      <section className="bg-navy py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Merchant checkout
            </p>
            <h2 className="mt-3 text-3xl font-black">QR, links, and a single checkout.</h2>
            <p className="mt-4 text-white/70">
              A customer scans. Enters an amount. Pays with MTN, Orange, card, or wallet.
              The merchant never implements those methods one by one.
            </p>
            <div className="mt-6 flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-brand" /> QR
              </span>
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-brand" /> lbpay.me/pay
              </span>
            </div>
          </div>
          <Image
            src="/illustrations/merchant-qr.png"
            alt="Merchant QR checkout"
            width={1024}
            height={1024}
            className="h-auto w-full rounded-[2rem]"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Developer platform
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Payments, payouts, sandbox, webhooks.
          </h2>
          <pre className="mt-6 overflow-x-auto rounded-2xl bg-navy p-5 font-mono text-xs leading-6 text-emerald-100">
{`const payment = await lbpay.payments.create({
  amount: 5000,
  currency: "XAF",
  customer: { phone: "6XXXXXXXX" },
  method: "mobile_money"
});`}
          </pre>
        </div>
        <Image
          src="/illustrations/developer-platform.png"
          alt="Developer platform"
          width={1536}
          height={1024}
          className="h-auto w-full rounded-[2rem] border border-line"
        />
      </section>

      <footer className="border-t border-line px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Logo />
          <p className="mt-4 max-w-3xl text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
        </div>
      </footer>
    </div>
  );
}
