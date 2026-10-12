"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Six boxes over one real input: paste works, phones offer the code from
 * the email/SMS, and screen readers see a single field.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  error,
  label = "6-digit code",
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        aria-label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        disabled={disabled}
        value={value}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, length);
          onChange(next);
          if (next.length === length) onComplete?.(next);
        }}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }} aria-hidden>
        {Array.from({ length }, (_, i) => {
          const char = value[i] || "";
          const isActive = focused && i === active && !disabled;
          return (
            <span
              key={i}
              className={cn(
                "grid aspect-[4/5] place-items-center rounded-2xl bg-paper font-mono text-2xl font-black text-ink ring-1 transition",
                error ? "ring-danger/60" : isActive ? "ring-2 ring-brand" : char ? "ring-brand/30" : "ring-line",
                char && "lb-check bg-white",
              )}
            >
              {char || (isActive ? <span className="h-6 w-0.5 animate-pulse rounded bg-brand" /> : "")}
            </span>
          );
        })}
      </div>
    </div>
  );
}
