"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHiddenAmount } from "@/components/house-card";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";

export function SearchJump({
  href,
  placeholder,
  name = "to",
}: {
  href: string;
  placeholder: string;
  name?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(event: FormEvent) {
    event.preventDefault();
    const next = value.trim();
    const url = next ? `${href}?${name}=${encodeURIComponent(next)}` : href;
    router.push(url);
  }

  return (
    <form onSubmit={go} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border-0 bg-[#eef1ef] pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/30"
      />
    </form>
  );
}

export function BalanceHero({
  label,
  amount,
  delta,
  cta,
}: {
  label: string;
  amount: number;
  delta: number;
  cta: { href: string; label: string };
}) {
  const { hidden, toggle } = useHiddenAmount();
  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });
  const deltaLabel = hidden
    ? "••••"
    : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatXAF(Math.abs(delta), { withCurrency: false })}`;

  return (
    <section>
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span>{label}</span>
        <button
          type="button"
          onClick={toggle}
          className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-white hover:text-ink"
          aria-label={hidden ? "Show amount" : "Hide amount"}
        >
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 font-mono text-[2.15rem] font-black leading-none tracking-tight text-ink sm:text-[2.45rem]">
          {shown}
        </p>
        <Link
          href={cta.href}
          className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,179,105,0.22)] hover:bg-brand-dark"
        >
          {cta.label}
        </Link>
      </div>
      <p
        className={cn(
          "mt-2 text-[13px] font-semibold",
          delta > 0 ? "text-brand-deep" : delta < 0 ? "text-danger" : "text-muted",
        )}
      >
        Today {deltaLabel}
        {hidden ? "" : " XAF"}
      </p>
    </section>
  );
}

export function ActionRail({
  items,
}: {
  items: Array<{ href: string; label: string; art?: string; icon?: LucideIcon }>;
}) {
  return (
    <nav className="grid grid-cols-5 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-1.5 text-center hover:bg-white"
          >
            {item.art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.art} alt="" width={52} height={52} draggable={false} className="h-[3.25rem] w-[3.25rem] object-contain" />
            ) : Icon ? (
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-ink shadow-[0_1px_2px_rgba(12,25,19,0.05)] ring-1 ring-line/80">
                <Icon className="h-5 w-5" />
              </span>
            ) : null}
            <span className="text-[11px] font-semibold text-ink">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PromoBanner({
  kicker,
  title,
  href,
  cta,
}: {
  kicker?: string;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="relative block overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8f8ef] via-[#f4fbf7] to-white p-4 ring-1 ring-brand/15"
    >
      {kicker ? <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep">{kicker}</p> : null}
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="max-w-[18ch] text-[1.15rem] font-black leading-tight tracking-tight text-ink">{title}</p>
        <span className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">{cta}</span>
      </div>
    </Link>
  );
}

export function SparkCard({
  href,
  title,
  value,
  hint,
  faces,
}: {
  href: string;
  title: string;
  value: string;
  hint: string;
  faces?: string[];
}) {
  return (
    <Link href={href} className="block rounded-2xl bg-white p-3.5 ring-1 ring-line/80 hover:ring-brand/30">
      <p className="text-[11px] font-semibold text-muted">{title}</p>
      <p className="mt-1 text-lg font-black tracking-tight text-ink">{value}</p>
      {faces?.length ? (
        <div className="mt-2 flex items-center">
          {faces.slice(0, 3).map((face, index) => (
            <span
              key={face + index}
              className="-ml-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-[9px] font-black text-brand-deep ring-2 ring-white first:ml-0"
            >
              {face}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-[11px] font-semibold text-brand-deep">{hint}</p>
    </Link>
  );
}

export function FeedTabs({
  tabs,
  active,
  onChange,
  moreHref,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  moreHref?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-line/80">
      <div className="flex min-w-0 gap-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 pb-2 text-[15px] font-bold",
              active === tab.id ? "border-ink text-ink" : "border-transparent text-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {moreHref ? (
        <Link href={moreHref} className="mb-2 shrink-0 text-xs font-bold text-muted hover:text-ink">
          View more
        </Link>
      ) : null}
    </div>
  );
}

export function MoneyRow({
  href,
  mark,
  title,
  meta,
  amount,
  tone,
  badge,
}: {
  href: string;
  mark: ReactNode;
  title: string;
  meta: string;
  amount: string;
  tone: "in" | "out" | "flat";
  badge?: ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-0.5 py-2.5 hover:bg-white">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef1ef] text-xs font-black text-ink">
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{title}</span>
        <span className="block truncate text-[12px] text-muted">{meta}</span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            "block font-mono text-sm font-black",
            tone === "in" ? "text-brand-deep" : tone === "out" ? "text-danger" : "text-ink",
          )}
        >
          {amount}
        </span>
        {badge}
      </span>
    </Link>
  );
}

export function HubNone() {
  return <p className="px-1 py-10 text-center text-sm text-muted">None</p>;
}
