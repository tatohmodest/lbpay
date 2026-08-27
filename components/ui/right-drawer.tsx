"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

export function RightDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "absolute inset-0 bg-navy/45 backdrop-blur-[3px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title || "Menu"}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(100%,21.5rem)] flex-col bg-white shadow-[-24px_0_80px_rgba(7,20,15,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="relative overflow-hidden border-b border-line px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <Logo href="/" markClassName="h-8 w-8" />
              {title ? <p className="mt-4 text-lg font-semibold tracking-tight text-ink">{title}</p> : null}
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
