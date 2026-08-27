"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";

export default function AdminHome() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load overview");
      return res.json();
    },
  });
  const data = overview.data;

  return (
    <div>
      <h1 className="text-3xl font-black">Platform control</h1>
      <p className="mt-1 text-sm text-muted">
        Admins can freeze accounts, approve KYC, fix transactions, and adjust wallets.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          { label: "Users", value: data?.users ?? "—" },
          { label: "Ledger (XAF)", value: data ? formatXAF(data.ledger, { withCurrency: false }) : "—" },
          { label: "Volume", value: data ? formatXAF(data.volume, { withCurrency: false }) : "—" },
          { label: "Pending KYC", value: data?.pendingKyc ?? "—" },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs font-bold uppercase text-muted">{item.label}</p>
            <p className="mt-2 font-mono text-2xl font-black">{item.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Link href="/admin/kyc" className="rounded-2xl border border-line bg-white p-5 font-semibold hover:border-brand">
          Review KYC
        </Link>
        <Link href="/admin/transactions" className="rounded-2xl border border-line bg-white p-5 font-semibold hover:border-brand">
          Fix transactions
        </Link>
        <Link href="/admin/wallets" className="rounded-2xl border border-line bg-white p-5 font-semibold hover:border-brand">
          Adjust wallets
        </Link>
      </div>
    </div>
  );
}
