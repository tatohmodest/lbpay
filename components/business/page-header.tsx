import type { ReactNode } from "react";

export function BusinessPageHeader({
  kicker = "Business",
  title,
  copy,
  action,
}: {
  kicker?: string;
  title: string;
  copy?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{kicker}</p>
        <h1 className="mt-1 text-xl font-black tracking-tight md:text-2xl">{title}</h1>
        {copy ? <p className="mt-1 text-sm leading-5 text-muted">{copy}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
