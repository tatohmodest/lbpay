"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Info, LoaderCircle, X, XCircle } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Notice } from "@/lib/notify";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  pending: LoaderCircle,
  info: Info,
  "money-in": ArrowDownLeft,
  "money-out": ArrowUpRight,
};

export function AnimatePresence({
  notices,
  dismiss,
}: {
  notices: Notice[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-4 md:items-end">
      {notices.map((notice) => {
        const Icon = icons[notice.kind];
        return (
          <div
            key={notice.id}
            className={cn(
              "pointer-events-auto lb-notice w-full max-w-sm overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_rgba(15,31,23,0.16)]",
              notice.kind === "error" && "border-red-200",
              notice.kind === "success" && "border-brand/30",
              notice.kind === "money-in" && "border-brand/40",
              notice.kind === "money-out" && "border-navy/20",
              notice.kind === "pending" && "border-amber-200",
            )}
          >
            <div className="flex gap-3 p-4">
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  notice.kind === "error" && "bg-red-50 text-danger",
                  notice.kind === "success" && "bg-brand-soft text-brand-dark",
                  notice.kind === "money-in" && "bg-brand text-white",
                  notice.kind === "money-out" && "bg-navy text-white",
                  notice.kind === "pending" && "bg-amber-50 text-amber-700",
                  notice.kind === "info" && "bg-paper text-brand",
                )}
              >
                <Icon className={cn("h-5 w-5", notice.kind === "pending" && "animate-spin")} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-ink">{notice.title}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(notice.id)}
                    className="rounded-full p-1 text-muted hover:bg-paper"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-0.5 text-sm text-muted">{notice.message}</p>
                {notice.amount != null ? (
                  <p className="mt-2 font-mono text-lg font-black text-brand">
                    {formatXAF(notice.amount)}
                  </p>
                ) : null}
              </div>
            </div>
            <div
              className={cn(
                "h-1 w-full",
                notice.kind === "error" ? "bg-danger" : "bg-brand",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
