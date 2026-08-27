"use client";

import { NetworkMark } from "@/components/network-mark";

export function NetworkToggle({
  value,
  onChange,
}: {
  value: "mtn" | "orange";
  onChange: (value: "mtn" | "orange") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["mtn", "orange"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${
            value === item ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
          }`}
        >
          <NetworkMark network={item} className="h-9 w-9 rounded-xl text-[9px]" />
          {item === "mtn" ? "MTN" : "Orange"}
        </button>
      ))}
    </div>
  );
}
