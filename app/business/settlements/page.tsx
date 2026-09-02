"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { HouseCard } from "@/components/house-card";
import { LEGAL_NOTE } from "@/lib/flags";
import { useMe } from "@/lib/hooks/wallet";

export default function SettlementsPage() {
  const me = useMe();
  const balance = me.data?.balance ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-2xl">
      <BusinessPageHeader title="Settlements" copy="Money ready to move when you need it." />
      <HouseCard
        title="My balance"
        subtitle="Ready to move when you need it"
        amount={balance}
        handle={me.data?.user?.lbpayId}
        detailsHref="/business/payments"
      />
      <p className="px-1 text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
    </div>
  );
}
