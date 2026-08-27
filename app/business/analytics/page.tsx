"use client";

import { Card } from "@/components/ui/card";
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

  return (
    <div>
      <h1 className="text-2xl font-black">Analytics</h1>
      <p className="text-sm text-muted">A simple view of collections on this account.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Revenue</p>
          <p className="mt-2 font-mono text-2xl font-bold">{formatXAF(revenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payments</p>
          <p className="mt-2 font-mono text-2xl font-bold">{collections.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active links</p>
          <p className="mt-2 font-mono text-2xl font-bold">{links.length}</p>
        </Card>
      </div>
    </div>
  );
}
