"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/config/site";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-stone-deep">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={item.question} className="border-b border-stone-deep">
            <h3 className="font-sans text-base font-normal leading-normal tracking-normal">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-start justify-between gap-6 py-6 text-left md:py-7"
              >
                <span className="font-serif text-[1.375rem] leading-snug text-ink transition-colors group-hover:text-forest md:text-[1.625rem]">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="relative mt-2.5 h-3 w-3 shrink-0 md:mt-3.5"
                >
                  <span className="absolute left-0 top-1/2 h-px w-3 bg-forest" />
                  <span
                    className={`absolute left-1/2 top-0 h-3 w-px bg-forest transition-transform duration-300 ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={`grid transition-[grid-template-rows] duration-400 ease-calm ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
              inert={!isOpen}
            >
              <div className="overflow-hidden">
                <div className="max-w-2xl space-y-3 pb-7 pr-8 text-muted">
                  {item.answer.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
