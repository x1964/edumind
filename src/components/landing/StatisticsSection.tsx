"use client";

import { motion, useInView, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { Users, BookOpen, Trophy, Zap } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Reveal } from "./Reveal";

interface StatCardProps {
  icon: typeof Users;
  value: number;
  suffix?: string;
  label: string;
  delay: number;
}

function StatCard({ icon: Icon, value, suffix = "", label, delay }: StatCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return (
    <Reveal delay={delay}>
      <motion.div
        ref={ref}
        className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface-raised/50 p-6 transition-all duration-300 hover:border-brand/30 hover:bg-surface-raised/80 hover:shadow-xl hover:shadow-brand/10"
        whileHover={{ y: -4, scale: 1.02 }}
      >
        {/* Background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          initial={false}
        />

        <div className="relative">
          <motion.div
            className="mb-4 inline-flex size-12 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand-ink transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <Icon className="size-6" aria-hidden="true" />
          </motion.div>

          <motion.div className="mb-2 flex items-baseline gap-1">
            <motion.span
              className="text-4xl font-bold tracking-tight text-ink sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: delay + 0.2 }}
            >
              {display}
            </motion.span>
            {suffix && (
              <motion.span
                className="text-xl font-semibold text-brand-ink"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: delay + 0.4 }}
              >
                {suffix}
              </motion.span>
            )}
          </motion.div>

          <motion.p
            className="text-sm font-medium text-ink-soft sm:text-base"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: delay + 0.3 }}
          >
            {label}
          </motion.p>
        </div>

        {/* Decorative dots */}
        <div className="pointer-events-none absolute right-2 top-2 flex gap-1" aria-hidden="true">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="size-1 rounded-full bg-brand/30"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </motion.div>
    </Reveal>
  );
}

export function StatisticsSection({ dict }: { dict: Dictionary }) {
  const copy = dict.statistics;
  const stats = [
    { icon: Users, value: 10000, suffix: "+", label: copy.activeStudents },
    { icon: BookOpen, value: 500000, suffix: "+", label: copy.materialsProcessed },
    { icon: Trophy, value: 95, suffix: "%", label: copy.successRate },
    { icon: Zap, value: 3, suffix: "x", label: copy.fasterLearning },
  ];

  return (
    <section className="em-section relative overflow-hidden">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(5,150,105,0.06),transparent_70%)]" />
        <div className="em-grid-lines absolute inset-0 opacity-40" />
      </div>

      <div className="em-container">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-ink/90">
              {copy.eyebrow}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-4 text-lg text-ink-soft">{copy.description}</p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Trust indicators */}
        <Reveal delay={0.4} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-8 border-t border-hairline/60 pt-8">
            {copy.trust.map((item, i) => (
              <motion.div
                key={item}
                className="flex items-center gap-2 text-sm font-medium text-ink-muted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="size-2 rounded-full bg-brand" />
                {item}
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
