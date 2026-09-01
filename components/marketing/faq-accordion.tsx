"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SITE_FAQS } from "@/lib/site";
import { cn } from "@/lib/cn";

export function FaqAccordion() {
  const [open, setOpen] = useState<string | null>(SITE_FAQS[0]?.question ?? null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {SITE_FAQS.map((item) => {
        const expanded = open === item.question;
        return (
          <article key={item.question}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : item.question)}
              className="flex w-full items-center justify-between gap-4 py-6 text-left"
            >
              <h3 className="text-base font-semibold text-ink md:text-lg">{item.question}</h3>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted transition-transform",
                  expanded && "rotate-180 text-brand-deep",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-6 text-sm leading-7 text-muted md:text-[15px]">{item.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
