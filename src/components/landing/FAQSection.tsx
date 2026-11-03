"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function FAQSection({ dict }: { dict: Dictionary }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const faq = dict.faq;

  return (
    <section id="faq" className="em-section relative">
      <div className="em-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionHeading
                eyebrow={faq.eyebrow}
                title={faq.title}
                description={faq.description}
              />
            </Reveal>
            <Reveal delay={0.08} className="mt-8">
              <div className="rounded-2xl border border-hairline bg-surface-raised/40 p-5">
                <div className="flex items-center gap-2 text-[11px] font-medium text-ink-soft">
                  <span className="grid size-6 place-items-center rounded-lg bg-brand/10 text-brand-ink">
                    <Sparkles className="size-3" aria-hidden="true" />
                  </span>
                  {faq.moreLabel}
                </div>
                <CtaLink
                  href="#start"
                  variant="secondary"
                  className="mt-3 h-9 w-full text-[12.5px]"
                  withArrow
                >
                  {dict.nav.getStarted}
                </CtaLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.05}>
            <div className="border-t border-hairline">
              {faq.items.map((item, index) => {
                const isOpen = open === index;
                const panelId = `faq-panel-${index}`;
                const buttonId = `faq-button-${index}`;
                return (
                  <div
                    key={item.question}
                    className={cn(
                      "border-b border-hairline transition-colors duration-300",
                      isOpen && "bg-brand/[0.025]"
                    )}
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpen(isOpen ? null : index)}
                        className="group flex w-full items-start gap-4 px-1 py-5 text-start sm:gap-5 sm:px-2"
                      >
                        <span
                          className={cn(
                            "mt-0.5 font-mono text-[10px] tracking-[0.12em] transition-colors",
                            isOpen ? "text-brand-ink" : "text-ink-muted/60"
                          )}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-[14px] font-medium leading-relaxed transition-colors sm:text-[15px]",
                            isOpen ? "text-ink" : "text-ink-soft group-hover:text-ink"
                          )}
                        >
                          {item.question}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-all duration-300",
                            isOpen
                              ? "rotate-45 border-brand/35 bg-brand/10 text-brand-ink"
                              : "border-hairline-strong text-ink-muted group-hover:border-brand/25 group-hover:text-ink-soft"
                          )}
                          aria-hidden="true"
                        >
                          <Plus className="size-3" />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="content"
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl px-1 pb-5 ps-8 text-[12.5px] leading-[1.95] text-ink-soft sm:ps-9 sm:text-[13px]">
                            {item.answer}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
