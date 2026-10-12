"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { TrustStrip } from "@/components/money-ui";

export function MoneyPage({
  title,
  copy,
  backHref = "/wallet",
  trust = "default",
  children,
}: {
  title: string;
  copy: string;
  backHref?: string;
  /** Reassurance line under the form. "refund" adds the automatic-refund promise for payouts. */
  trust?: "default" | "refund" | false;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line/80 transition hover:ring-brand/40"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-[1.75rem] font-black leading-tight tracking-tight text-ink">{title}</h1>
          <p className="text-[14px] text-muted">{copy}</p>
        </div>
      </div>
      {children}
      {trust ? <TrustStrip refund={trust === "refund"} className="pt-1" /> : null}
    </div>
  );
}

export function MoneyCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function RailTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center ring-1 transition",
        selected
          ? "bg-brand-soft text-brand-deep ring-brand/40"
          : "bg-[#f6f8f7] text-ink ring-transparent hover:bg-white hover:ring-line/80",
      )}
    >
      {children}
    </button>
  );
}
