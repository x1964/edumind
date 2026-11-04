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

  const spring = useSpring(0, { duration: 1600, bounce: 0 });
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return (
    <Reveal delay={delay}>
      <div
        ref={ref}
        className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-surface-raised/50 p-6 transition-all duration-300 hover:border-brand/25 hover:shadow-card"
      >
        <span
          className="grid size-10 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink"
          aria-hidden="true"
        >
          <Icon className="size-[18px]" />
        </span>

        <div className="mt-5 flex items-baseline gap-1" dir="auto">
          <motion.span className="em-num text-[32px] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-[36px]">
            {display}
          </motion.span>
          {suffix ? <span className="text-lg font-semibold text-brand-ink">{suffix}</span> : null}
        </div>

        <p className="mt-2.5 text-[13px] font-medium text-ink-muted">{label}</p>
      </div>
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
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(5,150,105,0.06),transparent_70%)]" />
        <div className="em-grid-lines absolute inset-0 opacity-40" />
      </div>

      <div className="em-container">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-brand-ink/90">
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
              delay={index * 0.08}
            />
          ))}
        </div>

        <Reveal delay={0.3} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-hairline/60 pt-8">
            {copy.trust.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[13px] text-ink-muted">
                <span className="size-1.5 rounded-full bg-brand/60" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
