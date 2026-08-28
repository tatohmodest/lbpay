"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { copyText, lbpayIdText } from "@/lib/clipboard";
import { useNotify } from "@/lib/notify";

export function CopyHandle({
  handle,
  className,
}: {
  handle?: string | null;
  className?: string;
}) {
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  const value = lbpayIdText(handle || "");
  if (!value) return null;

  async function copy() {
    try {
      await copyText(value);
      setCopied(true);
      notify.success("Copied", "Share your LBPay ID so people can pay you.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify.error("Could not copy", "Select the ID and copy it yourself.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copy LBPay ID"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono transition active:scale-95",
        className,
      )}
    >
      {value}
      {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />}
    </button>
  );
}
