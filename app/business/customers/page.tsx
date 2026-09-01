"use client";

import { BusinessPageHeader } from "@/components/business/page-header";
import { formatXAF } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";

export default function BusinessCustomersPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });
  const collections = (data.data?.collections || []) as Array<{
    id: string;
    counterparty: string;
    amount: number;
    status: string;
  }>;
  const customers = Object.values(
    collections.reduce<Record<string, { name: string; total: number; count: number }>>((map, tx) => {
      const name = tx.counterparty || "Customer";
      const current = map[name] || { name, total: 0, count: 0 };
      if (tx.status === "success") current.total += tx.amount;
      current.count += 1;
      map[name] = current;
      return map;
    }, {}),
  );

  return (
    <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-3xl">
      <BusinessPageHeader title="Customers" copy="Everyone who has paid you." />
      <div className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {customers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">None</p>
        ) : (
          customers.map((person) => (
            <div key={person.name} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{person.name}</p>
                <p className="text-xs text-muted">
                  {person.count} {person.count === 1 ? "payment" : "payments"}
                </p>
              </div>
              <p className="font-mono text-sm font-black">{formatXAF(person.total, { withCurrency: false })}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
