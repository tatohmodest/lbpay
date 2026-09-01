import { cn } from "@/lib/cn";

export function AuthScreen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-var(--header-h))] flex-col justify-center bg-paper px-4 py-10 md:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[420px]">{children}</div>
    </div>
  );
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-white p-6 shadow-[0_1px_2px_rgba(12,25,19,0.04)] md:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthTitle({
  kicker,
  title,
  subtitle,
  align = "left",
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-6", align === "center" && "text-center")}>
      {kicker ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{kicker}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
    </div>
  );
}
