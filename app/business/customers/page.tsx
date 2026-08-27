"use client";

import { Card } from "@/components/ui/card";
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
    <div>
      <h1 className="text-2xl font-black">Customers</h1>
      <p className="text-sm text-muted">Everyone who has paid you.</p>
      <Card className="mt-6 divide-y divide-line">
        {customers.length === 0 ? (
          <p className="p-6 text-sm text-muted">No customers yet.</p>
        ) : (
          customers.map((person) => (
            <div key={person.name} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{person.name}</p>
                <p className="text-xs text-muted">{person.count} payments</p>
              </div>
              <p className="font-mono text-sm">{formatXAF(person.total)}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
