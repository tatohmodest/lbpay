"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#0a2540] shadow-[0_12px_40px_rgba(10,37,64,0.18)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
          {label || "Request"}
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-emerald-100">
        {code}
      </pre>
    </div>
  );
}

export function CodeTabs({
  examples,
  labels = { curl: "cURL", node: "Node" },
  tone = "light",
}: {
  examples: { curl: string; node: string };
  labels?: { curl: string; node: string };
  tone?: "light" | "dark";
}) {
  const [tab, setTab] = useState<"curl" | "node">("curl");

  return (
    <div>
      <div
        className={cn(
          "mb-2 flex w-fit gap-1 rounded-lg p-1",
          tone === "dark" ? "bg-white/10" : "bg-paper",
        )}
      >
        {(["curl", "node"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              tab === id
                ? tone === "dark"
                  ? "bg-white/15 text-white"
                  : "bg-white text-ink shadow-sm"
                : tone === "dark"
                  ? "text-white/50 hover:text-white"
                  : "text-muted hover:text-ink",
            )}
          >
            {labels[id]}
          </button>
        ))}
      </div>
      <CodeBlock code={examples[tab]} label={labels[tab]} />
    </div>
  );
}
