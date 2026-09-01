"use client";

import { useEffect, useState } from "react";
import { DOC_GROUPS } from "@/lib/docs";
import { cn } from "@/lib/cn";

export function DocsSidebar() {
  const [active, setActive] = useState(DOC_GROUPS[0].items[0].id);

  useEffect(() => {
    const ids = DOC_GROUPS.flatMap((group) => group.items.map((item) => item.id));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Documentation" className="space-y-6">
      {DOC_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {group.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-[13px] transition",
                    active === item.id
                      ? "bg-brand-soft font-medium text-brand-deep"
                      : "text-[#3c4257] hover:bg-white hover:text-ink",
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsOnThisPage() {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        On this page
      </p>
      <ul className="mt-3 space-y-2 border-l border-line pl-3">
        {DOC_GROUPS.flatMap((group) => group.items).map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-[13px] text-muted hover:text-brand-deep">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
