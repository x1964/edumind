"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { Brain, BookOpen, FileText, Play, Sparkles, Zap } from "lucide-react";
import { useRef } from "react";
import type { Dictionary } from "@/lib/i18n";
import { CtaLink } from "./CtaLink";
import { ProductPreview } from "./ProductPreview";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection({ dict }: { dict: Dictionary }) {
  const reduceMotion = useReducedMotion();
  const hero = dict.hero;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  };

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-32 md:pb-28 lg:pt-36"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_60%_65%_at_50%_-10%,rgba(5,150,105,0.16),transparent_75%)]" />
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_48%_52%_at_15%_5%,rgba(16,185,129,0.1),transparent_72%)]" />
        <div className="em-grid-lines absolute inset-x-0 top-0 h-[560px] opacity-55" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-background/80 to-background" />
        <div className="em-noise opacity-50" />
      </div>

      <div className="em-container">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
          <motion.div
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate={isInView ? "visible" : "hidden"}
            className="flex max-w-2xl flex-col items-start lg:max-w-none"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.07] py-1.5 pe-3.5 ps-2.5 text-[13px] font-medium text-brand-ink">
                <span className="grid size-5 place-items-center rounded-full bg-brand/10">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </span>
                {hero.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-7 text-[clamp(2.4rem,5.4vw,4.25rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-ink"
            >
              <span className="mb-3 block text-[0.44em] font-medium leading-[1.34] tracking-[-0.02em] text-ink-soft sm:mb-4">
                {hero.headlineTop}
              </span>
              <span className="block text-balance">{hero.headlineMiddle}</span>
              <span className="em-text-gradient block pb-1.5 text-balance">
                {hero.headlineAccent}
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-[36rem] text-pretty text-[15.5px] leading-[1.85] text-ink-soft sm:text-base"
            >
              {hero.description}
            </motion.p>

            <motion.div
              variants={item}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
            >
              <CtaLink href="#start" size="lg" className="w-full sm:w-auto" withArrow>
                {hero.primaryCta}
              </CtaLink>
              <CtaLink
                href="#how-it-works"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <span className="grid size-5 place-items-center rounded-full border border-hairline-strong bg-black/[0.04]">
                  <Play className="size-2.5 fill-current" aria-hidden="true" />
                </span>
                {hero.secondaryCta}
              </CtaLink>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2.5"
            >
              <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                {hero.formatsLabel}
              </span>
              <span className="h-3 w-px bg-hairline-strong" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                {hero.formats.map((format) => (
                  <span
                    key={format}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-black/[0.02] px-2.5 py-1 text-[12px] text-ink-soft"
                  >
                    <FileText className="size-3 text-ink-muted" aria-hidden="true" />
                    {format}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline/60 pt-6"
            >
              {[
                { icon: Brain, label: hero.trust.ai },
                { icon: Zap, label: hero.trust.fast },
                { icon: BookOpen, label: hero.trust.personal },
              ].map((trust) => (
                <div key={trust.label} className="flex items-center gap-2">
                  <trust.icon className="size-4 text-brand-ink/70" aria-hidden="true" />
                  <span className="text-[12px] font-medium text-ink-muted">{trust.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="relative w-full"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand/15 via-brand/[0.06] to-transparent blur-3xl"
            />
            <ProductPreview dict={dict} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
