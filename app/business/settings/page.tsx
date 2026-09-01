"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { useQuery } from "@tanstack/react-query";
import { businessKindLabel } from "@/lib/kyc";

export default function BusinessSettingsPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });

  const rows = [
    { label: "Business name", value: data.data?.businessName || "n/a" },
    { label: "Type", value: data.data?.businessKind ? businessKindLabel(data.data.businessKind) : "Business" },
    { label: "Status", value: data.data?.kyc || "verified" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <BusinessPageHeader title="Settings" copy="How your business appears to customers." />
      <div className="space-y-3 rounded-[2rem] bg-white p-5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{row.label}</p>
            <p className="mt-1 font-bold">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
