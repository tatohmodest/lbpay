"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { HouseCard } from "@/components/business/house-card";
import { LEGAL_NOTE } from "@/lib/flags";
import { useMe } from "@/lib/hooks/wallet";

export default function SettlementsPage() {
  const me = useMe();
  const balance = me.data?.balance ?? 0;
  const shop = me.data?.user?.businessName || me.data?.user?.name || "Your shop";

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-2xl">
      <BusinessPageHeader title="Settlements" copy="Money ready to move when you need it." />
      <HouseCard label="Available" amount={balance} holder={shop} handle={me.data?.user?.lbpayId} />
      <p className="px-1 text-xs leading-5 text-muted">{LEGAL_NOTE}</p>
    </div>
  );
}
