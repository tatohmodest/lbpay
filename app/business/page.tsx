"use client";

import Link from "next/link";
import { Link2, QrCode, Receipt, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import { HouseCard, MetricCard, WalletTile } from "@/components/house-card";
import { CashFlow, monthlyInflow } from "@/components/cash-flow";
import { firstName, formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { useQuery } from "@tanstack/react-query";
import { payLinkPath } from "@/lib/origin";

const tiles = [
  { href: "/business/links", label: "Link", copy: "New checkout", icon: Link2, wrap: "bg-brand-soft text-brand-deep" },
  { href: "/business/qr", label: "QR", copy: "Scan to pay", icon: QrCode, wrap: "bg-[#e4eef8] text-[#3a5f86]" },
  { href: "/business/payments", label: "Sales", copy: "Collections", icon: Receipt, wrap: "bg-[#ece6f8] text-[#5b4a8a]" },
  { href: "/business/customers", label: "People", copy: "Who paid", icon: Users, wrap: "bg-[#f8e6e6] text-[#8a4545]" },
] as const;

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
  const shop = data.data?.businessName || me.data?.user?.businessName || "Your shop";
  const person = firstName(me.data?.user?.name) || shop;
  const revenue = data.data?.revenue || 0;
  const bars = monthlyInflow(
    collections.map((tx) => ({
      amount: tx.amount,
      status: tx.status,
      kind: "collection",
      createdAt: tx.createdAt,
    })),
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:max-w-none">
      <header className="flex items-center gap-3">
        <AppImg
          src={me.data?.user?.avatar}
          alt=""
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-[0_8px_20px_rgba(12,25,19,0.08)]"
        />
        <div className="min-w-0">
          <p className="text-lg font-black tracking-tight text-ink">Hello, {person}</p>
          <p className="truncate text-sm text-muted">{shop}</p>
        </div>
      </header>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">Here is the summary of your till.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <HouseCard
            title="My till"
            subtitle="What you have collected"
            amount={revenue}
            handle={me.data?.user?.lbpayId}
            detailsHref="/business/payments"
          />
        </div>
        <MetricCard
          href="/business/links"
          icon={Link2}
          iconWrap="bg-[#ece6f8] text-[#5b4a8a]"
          label="Payment links"
          value={String(links.length)}
          hint={links.length ? "Live checkouts" : "Create a checkout link"}
          status={links.length ? "See all" : "Create"}
        />
        <MetricCard
          href="/business/payments"
          icon={Receipt}
          iconWrap="bg-[#e4eef8] text-[#3a5f86]"
          label="Sales"
          value={String(collections.length)}
          hint="Customer collections"
          status="See all"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] lg:col-span-7">
          <div className="mb-3">
            <h2 className="text-base font-black">Collect</h2>
            <p className="mt-0.5 text-xs text-muted">Links, QR, and people who paid.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
              <WalletTile
                key={tile.href}
                href={tile.href}
                icon={tile.icon}
                iconWrap={tile.wrap}
                label={tile.label}
                copy={tile.copy}
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <CashFlow title="Collections" bars={bars} />
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">Links</h2>
            <p className="mt-0.5 text-xs text-muted">Checkout pages customers open.</p>
          </div>
          <Link href="/business/links" className="text-sm font-bold text-ink/70">
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
                className="flex items-center gap-3 rounded-2xl px-1.5 py-2.5 transition hover:bg-paper"
              >
                {link.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4ead2] text-[10px] font-bold text-[#8a691f]">
                    Pay
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{link.title}</p>
                  <p className="text-xs text-muted">Open checkout</p>
                </div>
                <p className="shrink-0 font-mono text-sm font-black text-ink">
                  {link.amount ? formatXAF(link.amount, { withCurrency: false }) : "Open"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">Recent activities</h2>
            <p className="mt-0.5 text-xs text-muted">Latest collections.</p>
          </div>
          {collections.length ? (
            <Link href="/business/payments" className="text-sm font-bold text-ink/70">
              See all
            </Link>
          ) : null}
        </div>
        {collections.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {collections.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 rounded-2xl px-1.5 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Initial name={tx.counterparty} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{tx.counterparty}</p>
                    <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-black text-brand-deep">
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

function Initial({ name }: { name: string }) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ece6f8] text-sm font-black text-[#5b4a8a]">
      {letter}
    </span>
  );
}
