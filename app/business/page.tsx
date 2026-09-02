"use client";

import Link from "next/link";
import { Link2, QrCode, Receipt, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import { HouseCard } from "@/components/house-card";
import { firstName, formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { useQuery } from "@tanstack/react-query";
import { payLinkPath } from "@/lib/origin";
import { cn } from "@/lib/cn";

const actions = [
  { href: "/business/links", label: "Link", copy: "New checkout", icon: Link2, tone: "leaf" },
  { href: "/business/qr", label: "QR", copy: "Scan to pay", icon: QrCode, tone: "mist" },
  { href: "/business/payments", label: "Sales", copy: "Collections", icon: Receipt, tone: "lilac" },
  { href: "/business/customers", label: "People", copy: "Who paid", icon: Users, tone: "blush" },
] as const;

const tones: Record<(typeof actions)[number]["tone"], string> = {
  leaf: "bg-brand-soft text-brand-deep",
  mist: "bg-[#e4eef8] text-[#3a5f86]",
  lilac: "bg-[#ece6f8] text-[#5b4a8a]",
  blush: "bg-[#f8e6e6] text-[#8a4545]",
};

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
  const series = collections
    .filter((tx) => tx.status === "success")
    .slice(0, 8)
    .map((tx) => tx.amount)
    .reverse();

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:max-w-3xl">
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

      <HouseCard
        label="Total collected"
        amount={data.data?.revenue || 0}
        holder={shop}
        handle={me.data?.user?.lbpayId}
        series={series}
      />

      <section className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-[1.25rem] bg-white px-1.5 py-3 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:bg-[#faf8f4]"
          >
            <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", tones[action.tone])}>
              <action.icon className="h-4 w-4" />
            </span>
            <span className="text-center">
              <span className="block text-[12px] font-bold text-ink">{action.label}</span>
              <span className="mt-0.5 block text-[10px] leading-3 text-muted">{action.copy}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="Till" value={formatXAF(data.data?.revenue || 0, { withCurrency: false })} />
        <Stat label="Links" value={String(links.length)} />
        <Stat label="Sales" value={String(collections.length)} />
      </section>

      <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Checkout</p>
            <h2 className="mt-1 text-base font-black">Links</h2>
          </div>
          <Link href="/business/links" className="text-sm font-bold text-ink/70">
            {links.length ? "See all" : "Create"}
          </Link>
        </div>
        {links.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f6f3ec] px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {links.slice(0, 4).map((link) => (
              <Link
                key={link.id}
                href={payLinkPath(link.slug)}
                className="flex items-center gap-3 rounded-2xl px-1.5 py-2.5 transition hover:bg-[#f6f3ec]"
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

      <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Ledger</p>
            <h2 className="mt-1 text-base font-black">Recent sales</h2>
          </div>
          {collections.length ? (
            <Link href="/business/payments" className="text-sm font-bold text-ink/70">
              See all
            </Link>
          ) : null}
        </div>
        {collections.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f6f3ec] px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {collections.slice(0, 5).map((tx) => (
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 truncate font-mono text-base font-black text-ink">{value}</p>
    </div>
  );
}

function Initial({ name }: { name: string }) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ece6f8] text-sm font-black text-[#5b4a8a]">
      {letter}
    </span>
  );
}
