import { Mail } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { Eyebrow } from "@/components/marketing/ui";
import { CONTACT_EMAIL } from "@/lib/flags";

export function legalId(title: string) {
  return title
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={legalId(title)} className="scroll-mt-[calc(var(--header-h)+1.5rem)] space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-ink md:text-[1.4rem]">{title}</h2>
      <div className="space-y-4 text-[16px] leading-[1.8] text-ink/75 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function LegalLayout({
  eyebrow = "Legal",
  title,
  updated,
  summary,
  toc,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated: string;
  summary: string[];
  toc: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-paper">
      <section className="relative -mt-[var(--header-h)] overflow-hidden bg-forest text-white">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <Container className="relative pb-14 pt-[calc(var(--header-h)+3rem)] md:pb-16 md:pt-[calc(var(--header-h)+4rem)]">
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.03em] md:text-6xl">{title}</h1>
          <p className="mt-4 text-[14px] text-hero-muted">Last updated {updated}</p>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <aside className="hidden lg:block">
          <nav aria-label="Sections" className="sticky top-[calc(var(--header-h)+1.5rem)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">On this page</p>
            <ol className="mt-4 space-y-1 border-l border-line">
              {toc.map((t) => (
                <li key={t}>
                  <a
                    href={`#${legalId(t)}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[14px] leading-5 text-muted transition hover:border-brand hover:text-ink"
                  >
                    {t.replace(/^\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ol>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-8 flex items-center gap-2 text-[14px] font-semibold text-brand-deep hover:underline"
            >
              <Mail className="h-4 w-4" /> Questions? Email us
            </a>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-line md:p-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-deep">In short</p>
            <ul className="mt-4 space-y-3">
              {summary.map((s) => (
                <li key={s} className="flex gap-3 text-[15px] leading-7 text-ink">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-12 space-y-12">{children}</div>
        </article>
      </Container>
    </div>
  );
}
