"use client";

import { motion, useReducedMotion } from "motion/react";
import { FileText, Play, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CtaLink } from "./CtaLink";
import { ProductPreview } from "./ProductPreview";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection({ dict }: { dict: Dictionary }) {
  const reduceMotion = useReducedMotion();
  const hero = dict.hero;

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
  };

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 md:pb-24 lg:pt-36"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(ellipse_58%_62%_at_74%_0%,rgba(5,150,105,0.13),transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_45%_50%_at_18%_8%,rgba(22,168,117,0.07),transparent_70%)]" />
        <div className="em-grid-lines absolute inset-x-0 top-0 h-[560px] opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        <div className="em-noise" />
      </div>

      <div className="em-container">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] lg:gap-10 xl:gap-14">
          <motion.div
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className="flex max-w-2xl flex-col items-start lg:max-w-none"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] py-1.5 pe-3.5 ps-2.5 text-[12px] font-medium text-brand-ink/95">
                <span className="relative flex size-4 items-center justify-center">
                  <span className="absolute size-4 rounded-full bg-brand/20 em-animate-pulse-soft" />
                  <Sparkles className="relative size-3" aria-hidden="true" />
                </span>
                {hero.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-[clamp(2.2rem,5.4vw,4.15rem)] font-semibold leading-[1.09] tracking-[-0.045em] text-ink"
            >
              <span className="mb-2.5 block text-[0.45em] font-medium leading-[1.35] tracking-[-0.02em] text-ink-soft sm:mb-3">
                {hero.headlineTop}
              </span>
              <span className="block text-balance">{hero.headlineMiddle}</span>
              <span className="em-text-gradient block pb-1.5 text-balance">
                {hero.headlineAccent}
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-[34rem] text-pretty text-[15px] leading-[1.9] text-ink-soft sm:text-base"
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
              className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2.5"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                {hero.formatsLabel}
              </span>
              <span className="h-3 w-px bg-hairline-strong" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                {hero.formats.map((format) => (
                  <span
                    key={format}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-black/[0.02] px-2.5 py-1 text-[11px] text-ink-soft"
                  >
                    <FileText className="size-3 text-ink-muted" aria-hidden="true" />
                    {format}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.25, ease }}
            className="relative w-full"
          >
            <ProductPreview dict={dict} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
