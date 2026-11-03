"use client";

import { motion, useReducedMotion, useInView } from "motion/react";
import { FileText, Play, Sparkles, Zap, Brain, BookOpen } from "lucide-react";
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
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
  };

  const floatingElements = [
    { delay: 0, duration: 3, y: [-10, 10, -10] },
    { delay: 0.5, duration: 4, y: [10, -10, 10] },
    { delay: 1, duration: 3.5, y: [-8, 8, -8] },
  ];

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-32 md:pb-28 lg:pt-40"
    >
      {/* Enhanced Background with Multiple Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {/* Primary gradient */}
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(ellipse_60%_65%_at_50%_-10%,rgba(5,150,105,0.18),transparent_75%)]" />
        {/* Secondary gradient */}
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_48%_52%_at_15%_5%,rgba(16,185,129,0.12),transparent_72%)]" />
        {/* Tertiary gradient */}
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_40%_45%_at_85%_10%,rgba(59,130,246,0.08),transparent_70%)]" />
        {/* Grid pattern */}
        <div className="em-grid-lines absolute inset-x-0 top-0 h-[600px] opacity-60" />
        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-background/80 to-background" />
        {/* Noise texture */}
        <div className="em-noise opacity-50" />
      </div>

      {/* Floating Particles */}
      <div className="pointer-events-none absolute inset-0 -z-5 overflow-hidden" aria-hidden="true">
        {floatingElements.map((anim, i) => (
          <motion.div
            key={i}
            className="absolute size-2 rounded-full bg-brand/30 blur-sm"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 25}%`,
            }}
            animate={{
              y: anim.y,
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: anim.duration,
              delay: anim.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="em-container">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
          <motion.div
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate={isInView ? "visible" : "hidden"}
            className="flex max-w-2xl flex-col items-start lg:max-w-none"
          >
            {/* Enhanced Badge */}
            <motion.div variants={item}>
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] py-2 pe-4 ps-3 text-[13px] font-semibold text-brand-ink shadow-lg shadow-brand/10 backdrop-blur-sm"
                whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(5,150,105,0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.span
                  className="relative flex size-5 items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <span className="absolute size-5 rounded-full bg-brand/25 em-animate-pulse-soft" />
                  <Sparkles className="relative size-3.5" aria-hidden="true" />
                </motion.span>
                {hero.badge}
              </motion.span>
            </motion.div>

            {/* Enhanced Heading */}
            <motion.h1
              variants={item}
              className="mt-8 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.05em] text-ink"
            >
              <motion.span
                className="mb-3 block text-[0.42em] font-semibold leading-[1.32] tracking-[-0.025em] text-ink-soft sm:mb-4"
                animate={{
                  backgroundPosition: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                {hero.headlineTop}
              </motion.span>
              <motion.span
                className="block text-balance"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {hero.headlineMiddle}
              </motion.span>
              <motion.span
                className="em-text-gradient block pb-2 text-balance"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {hero.headlineAccent}
              </motion.span>
            </motion.h1>

            {/* Enhanced Description */}
            <motion.p
              variants={item}
              className="mt-7 max-w-[38rem] text-pretty text-[16px] leading-[1.85] text-ink-soft sm:text-[17px]"
            >
              {hero.description}
            </motion.p>

            {/* Enhanced CTA Buttons */}
            <motion.div
              variants={item}
              className="mt-10 flex w-full flex-col gap-4 sm:flex-row sm:items-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <CtaLink
                  href="#start"
                  size="lg"
                  className="w-full sm:w-auto shadow-xl shadow-brand/20"
                  withArrow
                >
                  {hero.primaryCta}
                </CtaLink>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <CtaLink
                  href="#how-it-works"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto border-2"
                >
                  <motion.span
                    className="grid size-6 place-items-center rounded-full border border-hairline-strong bg-black/[0.05]"
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Play className="size-3 fill-current" aria-hidden="true" />
                  </motion.span>
                  {hero.secondaryCta}
                </CtaLink>
              </motion.div>
            </motion.div>

            {/* Enhanced Format Labels */}
            <motion.div
              variants={item}
              className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                {hero.formatsLabel}
              </span>
              <span className="h-4 w-px bg-hairline-strong" aria-hidden="true" />
              <div className="flex items-center gap-2">
                {hero.formats.map((format) => (
                  <motion.span
                    key={format}
                    className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-black/[0.03] px-3 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm transition-all hover:border-brand/30 hover:bg-brand/[0.06]"
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText className="size-3.5 text-brand-ink/80" aria-hidden="true" />
                    {format}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={item}
              className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline/60 pt-6"
            >
              {[
                { icon: Brain, label: hero.trust.ai },
                { icon: Zap, label: hero.trust.fast },
                { icon: BookOpen, label: hero.trust.personal },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <item.icon className="size-4 text-brand-ink/70" />
                  <span className="text-[11px] font-medium text-ink-muted">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Enhanced Product Preview with Glow Effect */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="relative w-full"
          >
            {/* Glow effect behind preview */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand/20 via-brand/10 to-transparent blur-3xl"
              animate={{
                opacity: [0.4, 0.6, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <ProductPreview dict={dict} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
