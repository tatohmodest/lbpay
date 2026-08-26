"use client";

import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";

export default function SplitPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Split bills</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted">
          Split requests are modeled as multiple payment requests against one ledger
          intent. Enable this live once KYC and request-money flows are production-ready.
        </p>
        <p className="mt-4 text-xs text-muted">{LEGAL_NOTE}</p>
      </Card>
    </div>
  );
}
