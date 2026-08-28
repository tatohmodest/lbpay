"use client";

import { useEffect } from "react";
import { Bell, X, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NOTICE_ICONS, noticeIconClass } from "@/components/notify-list";
import { formatXAF } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";
import { openPushPrompt, pushPermission } from "@/lib/push-client";

function timeAgo(createdAt: number) {
  const seconds = Math.max(0, Math.round((Date.now() - createdAt) / 1000));
  if (seconds < 45) return "Just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.max(1, Math.round(seconds / 3600))} hr ago`;
  return `${Math.max(1, Math.round(seconds / 86400))}d ago`;
}

export function NotificationInbox() {
  const { inbox, inboxOpen, closeInbox, removeFromInbox } = useNotify();

  useEffect(() => {
    if (!inboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeInbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inboxOpen, closeInbox]);

  if (!inboxOpen) return null;

  const alertsOff = pushPermission() !== "granted";

  return (
    <div className="fixed inset-0 z-[82] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[3px]"
        onClick={closeInbox}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lbpay-inbox-title"
        className="lb-sheet relative flex max-h-[min(40rem,90svh)] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(7,20,15,0.18)] sm:rounded-[2rem] sm:shadow-[0_24px_80px_rgba(7,20,15,0.16)]"
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-line" />
        </div>
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-4 sm:px-7 sm:pt-6">
          <div>
            <h2 id="lbpay-inbox-title" className="text-xl font-semibold tracking-tight text-ink">
              Notifications
            </h2>
            <p className="mt-1 text-sm text-muted">Money, collections, and account alerts.</p>
          </div>
          <button
            type="button"
            onClick={closeInbox}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          {inbox.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-paper text-ink">
                <Bell className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold text-ink">No alerts yet</p>
              <p className="mt-1 max-w-xs text-sm leading-6 text-muted">
                When money moves or your account changes, it will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {inbox.map((item) => {
                const Icon = NOTICE_ICONS[item.kind];
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex gap-3 rounded-2xl bg-paper p-3",
                      !item.read && "bg-brand-soft/60",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                        noticeIconClass(item.kind),
                      )}
                    >
                      <Icon className={cn("h-5 w-5", item.kind === "pending" && "animate-spin")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{item.title}</p>
                        <div className="flex items-center gap-2">
                          {!item.read ? (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy" />
                          ) : null}
                          <button
                            type="button"
                            aria-label="Delete"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-rose-600"
                            onClick={() => removeFromInbox(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm leading-5 text-muted">{item.message}</p>
                      {item.amount != null ? (
                        <p className="mt-1 font-mono text-sm font-bold text-brand">{formatXAF(item.amount)}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] font-medium text-muted">{timeAgo(item.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {alertsOff ? (
          <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                closeInbox();
                openPushPrompt();
              }}
            >
              Turn on phone alerts
            </Button>
          </div>
        ) : (
          <div className="h-[max(0.75rem,env(safe-area-inset-bottom))]" />
        )}
      </div>
    </div>
  );
}
