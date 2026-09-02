"use client";

import { useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";

const HIDE_KEY = "lbpay.till.hide";

export function HouseCard({
  label,
  amount,
  holder,
  handle,
  series,
}: {
  label: string;
  amount: number;
  holder: string;
  handle?: string;
  series?: number[];
}) {
  const [hidden, setHidden] = useState(false);
  const chipId = useId().replace(/:/g, "");

  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(HIDE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  function toggle() {
    setHidden((current) => {
      const next = !current;
      try {
        sessionStorage.setItem(HIDE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const shown = hidden ? "••••••" : formatXAF(amount, { withCurrency: false });

  return (
    <section
      className={cn(
        "lb-house-card relative overflow-hidden rounded-[1.4rem] p-5 text-white",
        "min-h-[11.5rem] sm:min-h-[12.25rem]",
      )}
    >
      <div className="lb-house-sheen" />
      <div className="relative z-10 flex h-full min-h-[9.5rem] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CardChip paintId={chipId} />
            <Contactless />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">LBPay</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">{label}</p>
              <button
                type="button"
                onClick={toggle}
                className="grid h-6 w-6 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                aria-label={hidden ? "Show amount" : "Hide amount"}
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[2rem] font-black leading-none tracking-tight sm:text-[2.35rem]">
              {shown}
              {hidden ? null : <span className="ml-1.5 text-sm font-semibold tracking-normal text-brand">XAF</span>}
            </p>
          </div>
          <Sparkline points={series || []} />
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Cardholder</p>
            <p className="truncate text-sm font-semibold tracking-wide text-white/90">{holder}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Pay ID</p>
            <p className="font-mono text-sm tracking-[0.18em] text-brand">
              {handle ? `@${handle.replace(/^@/, "")}` : "LBPAY"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardChip({ paintId }: { paintId: string }) {
  return (
    <svg width="36" height="26" viewBox="0 0 36 26" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={paintId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ef0c0" />
          <stop offset="0.45" stopColor="#00b369" />
          <stop offset="1" stopColor="#007a47" />
        </linearGradient>
      </defs>
      <rect width="36" height="26" rx="5" fill={`url(#${paintId})`} />
      <path
        d="M0 13h36M18 0v26M8 6.5h6.5M21.5 6.5H28M8 19.5h6.5M21.5 19.5H28"
        stroke="rgba(6,38,28,0.28)"
        strokeWidth="1"
      />
    </svg>
  );
}

function Contactless() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="text-brand">
      <path
        d="M7 5.2c1.6 1.3 1.6 6.3 0 7.6M9.6 3.6c2.3 1.9 2.3 8.9 0 10.8M12.2 2c3 2.5 3 11.5 0 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const vals = points.length >= 4 ? points : [3, 5, 4, 8, 6, 11, 9, 13];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const w = 88;
  const h = 36;
  const coords = vals.map((value, index) => {
    const x = (index / Math.max(vals.length - 1, 1)) * w;
    const y = h - 4 - ((value - min) / (max - min || 1)) * (h - 8);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <path d={area} fill="rgba(0,179,105,0.2)" />
      <path d={line} fill="none" stroke="#00b369" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
