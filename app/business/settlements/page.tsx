"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { formatXAF } from "@/lib/format";
import { LEGAL_NOTE } from "@/lib/flags";
import { useMe } from "@/lib/hooks/wallet";

export default function SettlementsPage() {
  const me = useMe();
  const balance = me.data?.balance ?? 0;

  return (
    <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-2xl">
      <BusinessPageHeader title="Settlements" copy="Money ready to move when you need it." />
      <section className="rounded-[2rem] bg-forest p-5 text-white shadow-[0_24px_80px_rgba(6,38,28,0.18)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Available</p>
        <p className="mt-2 font-mono text-3xl font-black">
          {formatXAF(balance, { withCurrency: false })}{" "}
          <span className="text-lg font-bold text-white/70">XAF</span>
        </p>
        <p className="mt-5 text-xs leading-5 text-white/65">{LEGAL_NOTE}</p>
      </section>
    </div>
  );
}
