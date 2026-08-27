"use client";

import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function BusinessSettingsPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black">Settings</h1>
      <p className="text-sm text-muted">Merchant profile for this account.</p>
      <Card className="mt-6 space-y-3 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Business name</p>
          <p className="mt-1 font-semibold">{data.data?.businessName || "n/a"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
          <p className="mt-1 font-semibold">{data.data?.kyc || "verified"}</p>
        </div>
      </Card>
    </div>
  );
}
