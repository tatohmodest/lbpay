import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em]",
        tone === "dark" ? "text-brand" : "text-brand-deep",
        className,
      )}
    >
      <span className={cn("h-px w-6", tone === "dark" ? "bg-brand/60" : "bg-brand-deep/40")} />
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.025em] md:text-[2.75rem]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Serif accent for one or two words inside a headline. */
export function Accent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-display italic", className)}>{children}</span>;
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-pretty text-[17px] leading-8 text-muted md:text-lg", className)}>
      {children}
    </p>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  arrow = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost-dark" | "white";
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-7 text-[15px]",
        variant === "primary" &&
          "bg-brand text-white shadow-[0_8px_24px_-8px_rgba(0,179,105,0.6)] hover:bg-brand-dark",
        variant === "secondary" && "bg-white text-ink ring-1 ring-line hover:ring-ink/20",
        variant === "ghost-dark" && "text-white ring-1 ring-white/20 hover:bg-white/10",
        variant === "white" && "bg-white text-forest hover:bg-white/90",
        className,
      )}
    >
      {children}
      {arrow ? (
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      ) : null}
    </Link>
  );
}

export function CheckList({
  items,
  tone = "light",
  className,
}: {
  items: React.ReactNode[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className={cn(
            "flex items-start gap-3 text-[15px] leading-6",
            tone === "dark" ? "text-white/80" : "text-ink",
          )}
        >
          <span
            className={cn(
              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
              tone === "dark" ? "bg-brand/20 text-brand" : "bg-brand-soft text-brand-deep",
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Small icon + title + copy block for feature grids. */
export function Feature({
  icon: Icon,
  title,
  children,
  tone = "light",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl",
          tone === "dark" ? "bg-white/[0.06] text-brand ring-1 ring-white/10" : "bg-brand-soft text-brand-deep",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className={cn("mt-4 text-[15px] font-semibold", tone === "dark" ? "text-white" : "text-ink")}>
        {title}
      </h3>
      <p className={cn("mt-1.5 text-sm leading-6", tone === "dark" ? "text-white/60" : "text-muted")}>
        {children}
      </p>
    </div>
  );
}

/** Dark page hero used by product and company pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  aside,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative -mt-[var(--header-h)] overflow-hidden bg-forest text-white", className)}>
      <div className="lb-glow pointer-events-none absolute inset-0" />
      <div className="lb-grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 px-5 pb-16 pt-[calc(var(--header-h)+3.5rem)] md:px-8 md:pb-24 md:pt-[calc(var(--header-h)+5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="lb-rise">
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-balance text-[2.5rem] font-bold leading-[1.05] tracking-[-0.03em] md:text-[3.75rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-[17px] leading-8 text-hero-muted">{lead}</p>
          {actions ? <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="lb-rise [animation-delay:150ms]">{aside}</div> : null}
      </div>
    </section>
  );
}

/** Closing call to action band shared by every marketing page. */
export function CtaBand({
  title,
  copy,
  primary = { href: "/signup", label: "Open your free account" },
  secondary,
}: {
  title: React.ReactNode;
  copy: React.ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="bg-paper px-5 pb-20 pt-4 md:px-8 lg:pb-24">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[2rem] bg-forest px-6 py-14 text-center text-white md:px-12 md:py-20">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.025em] md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-[16px] leading-7 text-hero-muted">{copy}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={primary.href} arrow>
              {primary.label}
            </ButtonLink>
            {secondary ? (
              <ButtonLink href={secondary.href} variant="ghost-dark">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
