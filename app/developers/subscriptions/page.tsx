"use client";

import { Card } from "@/components/ui/card";

export default function SubscriptionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-black">Subscriptions</h1>
      <p className="text-sm text-muted">
        Recurring collection where the rail and applicable rules permit it.
      </p>
      <Card className="mt-6 p-8 text-center text-sm text-muted">
        No plans yet. Live recurring billing stays behind approved developer KYC.
      </Card>
    </div>
  );
}
