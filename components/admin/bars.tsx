"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Lightweight 30-day bar chart. Hover or tap a bar to read its exact value. */
export function AdminBars({
  data,
  format,
}: {
  data: Array<{ label: string; value: number }>;
  format: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const focus = hover ?? data.length - 1;
  const point = data[focus];
  const day = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div>
      <p className="mb-2 h-5 text-[12px] text-muted">
        {point ? (
          <>
            <span className="font-semibold text-ink">{day(point.label)}</span> · {format(point.value)}
          </>
        ) : null}
      </p>
      <div className="flex h-40 items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            aria-label={`${day(d.label)}: ${format(d.value)}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onClick={() => setHover(i)}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={cn(
                "block w-full rounded-t-[4px] transition-colors",
                i === focus ? "bg-brand" : "bg-brand/25 group-hover:bg-brand/50",
              )}
              style={{ height: d.value ? `${Math.max(4, (d.value / max) * 100)}%` : "2px" }}
            />
          </button>
        ))}
      </div>
      {data.length ? (
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{day(data[0].label)}</span>
          <span>Today</span>
        </div>
      ) : null}
    </div>
  );
}
