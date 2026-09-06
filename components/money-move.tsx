"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function MoneyPage({
  title,
  copy,
  backHref = "/wallet",
  children,
}: {
  title: string;
  copy: string;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className="mt-0.5 grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-line/80"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted">{copy}</p>
        </div>
      </div>
      {children}
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
