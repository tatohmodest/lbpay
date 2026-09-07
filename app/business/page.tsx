"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ACTION_ART } from "@/lib/assets";
import { StatusBadge } from "@/components/ui/badge";
import { AppImg } from "@/components/app-img";
import {
  ActionRail,
  BalanceHero,
  FeedTabs,
  HubNone,
  MoneyRow,
  PromoBanner,
  SearchJump,
  SparkCard,
} from "@/components/money-hub";
import { firstName, formatDate, formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { useQuery } from "@tanstack/react-query";
import { payLinkPath } from "@/lib/origin";
import { txHref } from "@/lib/tx";

const actions = [
  { href: "/business/links", label: "Link", art: ACTION_ART.products },
  { href: "/business/qr", label: "QR", art: ACTION_ART.qr },
  { href: "/business/payments", label: "Sales", art: ACTION_ART.sales },
  { href: "/business/customers", label: "People", art: ACTION_ART.people },
  { href: "/business/links", label: "Shop", art: ACTION_ART.business },
] as const;

const tabs = [
  { id: "sales", label: "Sales" },
  { id: "links", label: "Links" },
  { id: "people", label: "People" },
];

export default function BusinessPage() {
  const me = useMe();
  const [tab, setTab] = useState("sales");
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
  const pending = collections.filter((tx) => tx.status === "pending");
  const today = useMemo(
    () =>
      collections
        .filter((tx) => {
          if (tx.status !== "success") return false;
          const at = new Date(tx.createdAt);
          const now = new Date();
          return (
            at.getFullYear() === now.getFullYear() &&
            at.getMonth() === now.getMonth() &&
            at.getDate() === now.getDate()
          );
        })
        .reduce((sum, tx) => sum + tx.amount, 0),
    [collections],
  );
  const payers = [...new Set(collections.map((tx) => tx.counterparty).filter(Boolean))];

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        <header className="flex items-center gap-3">
          <AppImg src={me.data?.user?.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{person}</p>
            <p className="truncate text-xs text-muted">{shop}</p>
          </div>
          <Link
            href="/business/qr"
            className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-line/80"
            aria-label="Shop QR"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ACTION_ART.qr} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          </Link>
        </header>

        <SearchJump href="/business/links" placeholder="Find a checkout or make one" name="q" />

        <BalanceHero
          label="Till (XAF)"
          amount={revenue}
          delta={today}
          cta={{ href: "/business/links", label: "New link" }}
        />

        <ActionRail items={[...actions]} />

        <PromoBanner
          kicker="Collect"
          title="Get paid with a link or QR."
          href="/business/links"
          cta="Create"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <SparkCard
            href="/business/customers"
            title="People"
            value={payers.length ? String(payers.length) : "None"}
            hint="Who paid"
            faces={payers.slice(0, 3).map((name) => (name.trim().slice(0, 1) || "?").toUpperCase())}
          />
          <SparkCard
            href="/business/payments"
            title="Incoming"
            value={pending.length ? String(pending.length) : "None"}
            hint={pending.length ? "Still open" : "Nothing pending"}
          />
        </div>
      </div>

      <div className="lg:col-span-7">
        <FeedTabs
          tabs={tabs}
          active={tab}
          onChange={setTab}
          moreHref={tab === "links" ? "/business/links" : tab === "people" ? "/business/customers" : "/business/payments"}
        />
        <div className="pt-1">
          {tab === "links" ? (
            links.length ? (
              links.slice(0, 8).map((link) => (
                <Link
                  key={link.id}
                  href={payLinkPath(link.slug)}
                  className="flex items-center gap-3 rounded-xl px-0.5 py-2.5 hover:bg-white"
                >
                  {link.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef1ef] text-xs font-black text-ink">
                      {link.title.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{link.title}</span>
                    <span className="block text-[12px] text-muted">Open checkout</span>
                  </span>
                  <span className="font-mono text-sm font-black text-ink">
                    {link.amount ? formatXAF(link.amount, { withCurrency: false }) : "Open"}
                  </span>
                </Link>
              ))
            ) : (
              <HubNone />
            )
          ) : null}
          {tab === "people" ? (
            payers.length ? (
              payers.slice(0, 8).map((name) => (
                <Link
                  key={name}
                  href="/business/customers"
                  className="flex items-center gap-3 rounded-xl px-0.5 py-2.5 hover:bg-white"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef1ef] text-xs font-black text-ink">
                    {(name.trim().slice(0, 1) || "?").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{name}</span>
                    <span className="block text-[12px] text-muted">Customer</span>
                  </span>
                  <span className="text-sm font-bold text-brand">See</span>
                </Link>
              ))
            ) : (
              <HubNone />
            )
          ) : null}
          {tab === "sales" ? (
            collections.length ? (
              collections.slice(0, 8).map((tx) => (
                <MoneyRow
                  key={tx.id}
                  href={txHref(tx.id)}
                  mark={(tx.counterparty.trim().slice(0, 1) || "?").toUpperCase()}
                  title={tx.counterparty}
                  meta={`${tx.method} · ${formatDate(tx.createdAt)}`}
                  amount={`+${formatXAF(tx.amount, { withCurrency: false })}`}
                  tone="in"
                  badge={<StatusBadge status={tx.status} />}
                />
              ))
            ) : (
              <HubNone />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
