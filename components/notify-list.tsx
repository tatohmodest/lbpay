"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Info, LoaderCircle, X, XCircle } from "lucide-react";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Notice } from "@/lib/notify";

export const NOTICE_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  pending: LoaderCircle,
  info: Info,
  "money-in": ArrowDownLeft,
  "money-out": ArrowUpRight,
};

export function noticeIconClass(kind: Notice["kind"]) {
  if (kind === "error") return "bg-red-50 text-danger";
  if (kind === "success") return "bg-brand-soft text-brand-dark";
  if (kind === "money-in") return "bg-brand text-white";
  if (kind === "money-out") return "bg-navy text-white";
  if (kind === "pending") return "bg-amber-50 text-amber-700";
  return "bg-paper text-brand";
}

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
        const Icon = NOTICE_ICONS[notice.kind];
        return (
          <div
            key={notice.id}
            className="pointer-events-auto lb-notice w-full max-w-sm rounded-2xl border border-line bg-white shadow-[0_18px_50px_rgba(15,31,23,0.16)]"
          >
            <div className="flex gap-3 p-4">
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  noticeIconClass(notice.kind),
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
          </div>
        );
      })}
    </div>
  );
}
