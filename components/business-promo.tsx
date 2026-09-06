"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS_BANNER } from "@/lib/assets";

export function BusinessPromo({
  href = "/business",
  title = "Run your business with LBPay",
  subtitle = "Create product links and share them with customers to get paid.",
  cta = "Click here",
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(6,38,28,0.08)] ring-1 ring-black/[0.06] transition hover:shadow-[0_16px_40px_rgba(6,38,28,0.12)]"
    >
      <Image
        src={BUSINESS_BANNER}
        alt="Run your business with LBPay. Create product links and share them with customers to get paid."
        width={1536}
        height={1024}
        className="aspect-[1536/1024] w-full object-cover object-center"
      />
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-black leading-tight text-ink">{title}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center rounded-full border border-ink px-3.5 text-[12px] font-bold text-ink transition group-hover:bg-paper">
          {cta}
        </span>
      </div>
    </Link>
  );
}

export function BusinessPitchBanner({ className }: { className?: string }) {
  return (
    <Image
      src={BUSINESS_BANNER}
      alt="Run your business with LBPay. Create product links, share with customers, receive payments."
      width={1536}
      height={1024}
      priority
      className={className}
    />
  );
}

export function ShopShareHint() {
  return (
    <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand-deep">
      Share the shop or a single product <ArrowRight className="h-3.5 w-3.5" />
    </p>
  );
}
