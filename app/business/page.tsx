"use client";

import Link from "next/link";
import { Link2, QrCode, Receipt, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { useQuery } from "@tanstack/react-query";
import { payLinkPath } from "@/lib/origin";

const actions = [
  { href: "/business/links", label: "New link", copy: "A checkout anyone can pay", icon: Link2 },
  { href: "/business/qr", label: "My QR", copy: "Let a customer scan and pay", icon: QrCode },
  { href: "/business/payments", label: "Sales", copy: "Every collection in one list", icon: Receipt },
  { href: "/business/customers", label: "Customers", copy: "People who have paid you", icon: Users },
];

export default function BusinessPage() {
  const me = useMe();
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json as {
        businessName: string;
        revenue: number;
        links: Array<{
          id: string;
          slug: string;
          title: string;
          amount: number | null;
          imageUrl?: string;
        }>;
        collections: Array<{
          id: string;
          createdAt: string;
          counterparty: string;
          method: "mtn" | "orange" | "card" | "wallet";
          amount: number;
          status: "success" | "failed" | "pending" | "cancelled" | "expired";
        }>;
      };
    },
  });

  const links = data.data?.links || [];
  const collections = data.data?.collections || [];
  const shop = data.data?.businessName || me.data?.user?.businessName || "Business";

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-3xl">
      <section className="relative overflow-hidden rounded-[2rem] bg-forest p-5 text-white shadow-[0_24px_80px_rgba(6,38,28,0.18)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{shop}</p>
          <p className="mt-3 text-xs text-white/65">Collected</p>
          <h1 className="mt-1 font-mono text-3xl font-black tracking-tight md:text-4xl">
            {formatXAF(data.data?.revenue || 0, { withCurrency: false })}{" "}
            <span className="text-lg font-bold text-white/70">XAF</span>
          </h1>
          <p className="mt-2 text-xs text-white/60">
            {links.length} {links.length === 1 ? "link" : "links"} · {collections.length}{" "}
            {collections.length === 1 ? "sale" : "sales"}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href="/business/links">
              <Button className="h-11 w-full rounded-full bg-white text-brand hover:bg-brand-soft">
                New link
              </Button>
            </Link>
            <Link href="/business/qr">
              <Button className="h-11 w-full rounded-full border-0 bg-white/10 text-white hover:bg-white/15">
                My QR
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-1.5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="grid grid-cols-2 gap-1">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col gap-2.5 rounded-[1.5rem] p-3.5 transition hover:bg-paper"
            >
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-soft text-brand">
                <action.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{action.label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-muted">{action.copy}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Checkout</p>
            <h2 className="mt-1 text-lg font-black">Links</h2>
          </div>
          <Link href="/business/links" className="text-sm font-bold text-brand">
            {links.length ? "See all" : "Create"}
          </Link>
        </div>
        {links.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {links.slice(0, 4).map((link) => (
              <Link
                key={link.id}
                href={payLinkPath(link.slug)}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-paper"
              >
                {link.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-[10px] font-bold text-brand-deep">
                    Pay
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{link.title}</p>
                  <p className="text-xs text-muted">Open checkout</p>
                </div>
                <p className="shrink-0 font-mono text-sm font-black">
                  {link.amount ? formatXAF(link.amount, { withCurrency: false }) : "Open"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Activity</p>
            <h2 className="mt-1 text-lg font-black">Recent sales</h2>
          </div>
          {collections.length ? (
            <Link href="/business/payments" className="text-sm font-bold text-brand">
              See all
            </Link>
          ) : null}
        </div>
        {collections.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {collections.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{tx.counterparty}</p>
                  <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-black">
                    +{formatXAF(tx.amount, { withCurrency: false })}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
