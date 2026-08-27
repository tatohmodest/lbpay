"use client";

import { Delete, Fingerprint } from "lucide-react";
import { cn } from "@/lib/cn";

export function PinPad({
  value,
  onChange,
  length = 4,
  error,
  hint,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div>
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition",
              value.length > i ? "border-brand bg-brand" : "border-line bg-white",
              error && "border-danger",
            )}
          />
        ))}
      </div>
      {hint ? <p className="mb-4 text-center text-sm text-muted">{hint}</p> : null}
      {error ? <p className="mb-4 text-center text-sm font-semibold text-danger">{error}</p> : null}
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {keys.map((key) => {
          if (!key) return <span key="blank" />;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (disabled) return;
                if (key === "del") onChange(value.slice(0, -1));
                else if (value.length < length) onChange(value + key);
              }}
              disabled={disabled}
              className="grid h-16 place-items-center rounded-2xl bg-paper text-2xl font-bold text-ink transition active:scale-95 hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {key === "del" ? <Delete className="h-6 w-6" /> : key}
            </button>
          );
        })}
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
        <Fingerprint className="h-4 w-4 text-brand" /> PIN stays on LBPay. Never share it.
      </p>
    </div>
  );
}
