import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminHeader({
  title,
  copy,
  action,
}: {
  title: string;
  copy?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
        {copy ? <p className="mt-1 text-sm text-muted">{copy}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AdminStat({
  label,
  value,
  hint,
  tone = "white",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "white" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] p-5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]",
        tone === "green" ? "lb-house-card text-white" : "border border-line/80 bg-white",
      )}
    >
      <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", tone === "green" ? "text-white/70" : "text-muted")}>
        {label}
      </p>
      <p className="mt-2 truncate font-mono text-2xl font-black">{value}</p>
      {hint ? (
        <p className={cn("mt-1 text-xs", tone === "green" ? "text-white/70" : "text-muted")}>{hint}</p>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  title,
  copy,
  action,
  children,
}: {
  title?: string;
  copy?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-line/80 bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
      {title ? (
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <h2 className="text-base font-black">{title}</h2>
            {copy ? <p className="mt-0.5 text-xs text-muted">{copy}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title ? "p-2 pt-2" : "p-2"}>{children}</div>
    </section>
  );
}
