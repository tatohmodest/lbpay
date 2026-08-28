"use client";

import { DeveloperKeysPanel } from "@/components/developer-keys";

export default function KeysPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black">Applications</h1>
      <p className="mt-1 text-sm text-muted">
        Switch sandbox and live. Regenerating replaces the same key. The old secret stops working.
      </p>
      <div className="mt-6">
        <DeveloperKeysPanel />
      </div>
    </div>
  );
}
