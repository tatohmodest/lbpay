"use client";

import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/store";

export default function BeneficiariesPage() {
  const { state } = useApp();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Beneficiaries</h1>
      <div className="mt-6 space-y-3">
        {state.beneficiaries.length === 0 ? (
          <Card className="p-6 text-sm text-muted">Saved people will appear here after you send to them.</Card>
        ) : (
          state.beneficiaries.map((person) => (
            <Card key={person.id} className="p-4">
              <p className="font-semibold">{person.name}</p>
              <p className="text-sm text-muted">
                {person.lbpayId ? `@${person.lbpayId}` : person.phone}{" "}
                {person.network ? `· ${person.network.toUpperCase()}` : "· LBPay"}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
