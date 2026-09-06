"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

export function BusinessPromo({ href = "/business" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-line/80 shadow-[0_10px_30px_rgba(6,38,28,0.06)] transition hover:shadow-[0_16px_40px_rgba(6,38,28,0.12)]"
    >
      <Image
        src="/illustrations/business-banner.webp"
        alt="Run your business with LBPay. Create product links and share them with customers to get paid."
        width={1536}
        height={1024}
        className="aspect-[1536/1024] w-full object-cover"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-black leading-tight text-ink">Sell with product links</p>
          <p className="mt-0.5 truncate text-xs text-muted">Share a shop page or one product. Customers pay you directly.</p>
        </div>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-white transition group-hover:bg-brand-dark">
          <Store className="h-3.5 w-3.5" /> Start selling
        </span>
      </div>
    </Link>
  );
}

export function BusinessPitchBanner({ className }: { className?: string }) {
  return (
    <Image
      src="/illustrations/business-banner.webp"
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
