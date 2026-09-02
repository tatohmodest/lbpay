"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CopyHandle } from "@/components/copy-handle";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";

const HIDE_KEY = "lbpay.till.hide";

export function HouseCard({
  title,
  subtitle,
  amount,
  handle,
  detailsHref,
  detailsLabel = "See details",
}: {
  title: string;
  subtitle?: string;
  amount: number;
  handle?: string;
  detailsHref?: string;
  detailsLabel?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const gridId = useId().replace(/:/g, "");

  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(HIDE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  function toggle() {
    setHidden((current) => {
      const next = !current;
      try {
        sessionStorage.setItem(HIDE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });

  return (
    <section
      className={cn(
        "lb-house-card relative flex h-full min-h-[13.5rem] flex-col overflow-hidden rounded-[1.25rem] p-5 text-white sm:min-h-[15.5rem]",
      )}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.28]" aria-hidden>
        <defs>
          <pattern id={gridId} width="28" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <path d="M28 0H0V48" fill="none" stroke="white" strokeWidth="0.9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />
      </svg>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand shadow-[0_8px_18px_rgba(6,38,28,0.12)]">
          <Wallet className="h-5 w-5" />
        </span>
        <button
          type="button"
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label={hidden ? "Show amount" : "Hide amount"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative z-10 mt-6 min-w-0">
        <p className="text-[15px] font-semibold">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-white/70">{subtitle}</p> : null}
        <div className="mt-3 flex flex-wrap items-end gap-2.5">
          <p className="font-mono text-[2.15rem] font-black leading-none tracking-tight sm:text-[2.35rem]">
            {shown}
            {hidden ? null : <span className="ml-1.5 text-sm font-semibold tracking-normal text-white/80">XAF</span>}
          </p>
          {handle ? (
            <CopyHandle
              handle={handle}
              className="mb-0.5 rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-semibold tracking-normal text-white hover:bg-white/28"
            />
          ) : null}
        </div>
      </div>

      {detailsHref ? (
        <Link
          href={detailsHref}
          className="relative z-10 mt-auto flex items-center justify-between border-t border-white/20 pt-3.5 text-sm font-semibold"
        >
          {detailsLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <div className="mt-auto" />
      )}
    </section>
  );
}

export function MetricCard({
  href,
  icon: Icon,
  iconWrap,
  label,
  value,
  hint,
  status,
}: {
  href: string;
  icon: LucideIcon;
  iconWrap: string;
  label: string;
  value: string;
  hint?: string;
  status?: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-full min-h-[11.25rem] flex-col rounded-[1.25rem] border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:border-brand/30 sm:min-h-[15.5rem] sm:p-5"
    >
      <span className={cn("grid h-11 w-11 place-items-center rounded-full", iconWrap)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-muted sm:mt-6">{label}</p>
      <p className="mt-2 text-[1.2rem] font-black leading-none tracking-tight text-ink sm:text-[1.65rem]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
      {status ? <p className="mt-auto pt-5 text-xs font-semibold text-brand">{status}</p> : <span className="mt-auto" />}
    </Link>
  );
}

export function WalletTile({
  href,
  icon: Icon,
  iconWrap,
  label,
  copy,
  status = "Open",
  statusTone = "ok",
}: {
  href: string;
  icon: LucideIcon;
  iconWrap: string;
  label: string;
  copy: string;
  status?: string;
  statusTone?: "ok" | "soon";
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.15rem] border border-line/70 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:border-brand/30"
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-9 w-9 place-items-center rounded-full", iconWrap)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold text-ink">{label}</span>
      </div>
      <p className="mt-5 text-[15px] font-black tracking-tight text-ink">{copy}</p>
      <p
        className={cn(
          "mt-4 text-xs font-semibold",
          statusTone === "ok" ? "text-brand" : "text-muted",
        )}
      >
        {status}
      </p>
    </Link>
  );
}
