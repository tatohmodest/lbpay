"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { formatXAF } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";

export default function BusinessAnalyticsPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });
  const revenue = data.data?.revenue || 0;
  const collections = data.data?.collections || [];
  const links = data.data?.links || [];

  const stats = [
    { label: "Revenue", value: formatXAF(revenue, { withCurrency: false }) },
    { label: "Payments", value: String(collections.length) },
    { label: "Links", value: String(links.length) },
  ];

  return (
    <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-3xl">
      <BusinessPageHeader title="Analytics" copy="A simple view of how the shop is doing." />
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.5rem] bg-white px-3 py-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
            <p className="mt-2 truncate font-mono text-lg font-black md:text-xl">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
