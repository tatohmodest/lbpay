"use client";

import { Card } from "@/components/ui/card";

export default function SubscriptionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-black">Subscriptions</h1>
      <p className="text-sm text-muted">Charge customers on a schedule.</p>
      <Card className="mt-6 p-8 text-center text-sm text-muted">
        Recurring billing is coming soon.
      </Card>
    </div>
  );
}
