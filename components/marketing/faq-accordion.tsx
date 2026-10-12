"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SITE_FAQS } from "@/lib/site";
import { cn } from "@/lib/cn";

export function FaqAccordion({ items = SITE_FAQS }: { items?: readonly { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.question ?? null);

  return (
    <div className="divide-y divide-line rounded-[1.5rem] bg-white px-5 ring-1 ring-line md:px-8">
      {items.map((item) => {
        const expanded = open === item.question;
        return (
          <article key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : item.question)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] font-semibold text-ink transition hover:text-brand-deep md:py-6 md:text-[17px]"
              >
                {item.question}
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full transition duration-300",
                    expanded ? "rotate-45 bg-brand text-white" : "bg-paper text-ink",
                  )}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 text-[15px] leading-7 text-muted">{item.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
