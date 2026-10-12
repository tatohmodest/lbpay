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
import { shopHandlePath } from "@/lib/origin";
import { ProductCard } from "@/components/product-card";
import { BadgeCheck, ExternalLink, Plus } from "lucide-react";
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
          compareAtAmount?: number | null;
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

      <div className="space-y-5 lg:col-span-7">
        <ShopShelf
          shop={shop}
          handle={me.data?.user?.lbpayId || ""}
          avatar={me.data?.user?.avatar}
          verified={me.data?.user?.kyc?.business === "verified"}
          links={links}
        />
        <div>
        <FeedTabs
          tabs={tabs}
          active={tab}
          onChange={setTab}
          moreHref={tab === "links" ? "/business/links" : tab === "people" ? "/business/customers" : "/business/payments"}
        />
        <div className="pt-1">
          {tab === "links" ? (
            links.length ? (
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                {links.slice(0, 6).map((link) => (
                  <ProductCard
                    key={link.id}
                    mode="pay"
                    product={{
                      slug: link.slug,
                      title: link.title,
                      amount: link.amount,
                      compareAtAmount: link.compareAtAmount,
                      imageUrl: link.imageUrl,
                    }}
                  />
                ))}
              </div>
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
    </div>
  );
}

function ShopShelf({
  shop,
  handle,
  avatar,
  verified,
  links,
}: {
  shop: string;
  handle: string;
  avatar?: string;
  verified: boolean;
  links: Array<{ id: string; slug: string; title: string; amount: number | null; compareAtAmount?: number | null; imageUrl?: string }>;
}) {
  const shopPath = handle ? shopHandlePath(handle) : "";
  return (
    <section className="rounded-[2rem] bg-forest p-3 sm:p-4" aria-label="Your shop">
      <div className="rounded-[1.5rem] bg-paper p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <AppImg src={avatar} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1.5 truncate font-bold text-ink">
              <span className="truncate">{shop}</span>
              {verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-brand" aria-label="Verified" /> : null}
            </p>
            {shopPath ? <p className="truncate font-mono text-[12px] text-muted">lbpay · {shopPath}</p> : null}
          </div>
          {shopPath ? (
            <Link
              href={shopPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-ink ring-1 ring-line transition hover:ring-brand/40"
            >
              Open <ExternalLink className="h-3 w-3" />
            </Link>
          ) : null}
        </div>

        {links.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {links.slice(0, 6).map((link) => (
              <ProductCard
                key={link.id}
                mode="pay"
                product={{
                  slug: link.slug,
                  title: link.title,
                  amount: link.amount,
                  compareAtAmount: link.compareAtAmount,
                  imageUrl: link.imageUrl,
                }}
              />
            ))}
          </div>
        ) : (
          <Link
            href="/business/links"
            className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-10 text-center transition hover:border-brand/40"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-bold text-ink">Add your first product</span>
            <span className="mt-1 text-xs text-muted">A photo and a price. Your shop page is ready in a minute.</span>
          </Link>
        )}

        {links.length ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">This is exactly what your customers see.</p>
            <Link href="/business/links" className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-deep">
              <Plus className="h-3.5 w-3.5" /> Add product
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
