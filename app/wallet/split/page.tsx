"use client";

import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";

export default function SplitPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Split bills</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted">
          Share a bill with friends in a few taps. This is coming soon.
        </p>
        <p className="mt-4 text-xs text-muted">{LEGAL_NOTE}</p>
      </Card>
    </div>
  );
}
