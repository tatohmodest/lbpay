"use client";

import { CodeTabs } from "@/components/docs/code-block";
import { PAYMENT_EXAMPLES } from "@/lib/docs";

export function DeveloperCodePanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#08182c] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <p className="ml-2 text-[11px] font-medium text-white/45">payments.create</p>
      </div>
      <div className="space-y-3 p-4">
        <CodeTabs examples={PAYMENT_EXAMPLES} tone="dark" />
      </div>
    </div>
  );
}
