"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import type { Dictionary, TestimonialItem } from "@/lib/i18n";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const RATING = 5;

function TestimonialCard({ testimonial, index }: { testimonial: TestimonialItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <Reveal delay={index * 0.08}>
      <motion.div
        ref={ref}
        className="group relative h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <motion.div
          className="relative h-full rounded-2xl border border-hairline bg-surface-raised/50 p-6 transition-all duration-300 hover:border-brand/30 hover:bg-surface-raised/80 hover:shadow-xl hover:shadow-brand/10"
          whileHover={{ y: -6, scale: 1.02 }}
        >
          <motion.div
            className="absolute right-4 top-4 text-brand/20"
            initial={{ rotate: -10, scale: 0.8 }}
            animate={isInView ? { rotate: 0, scale: 1 } : { rotate: -10, scale: 0.8 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
          >
            <Quote className="size-8" aria-hidden="true" />
          </motion.div>

          <div className="mb-4 flex gap-1" aria-label={`${RATING}/5`}>
            {[...Array(RATING)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1 + 0.3 + i * 0.05,
                  type: "spring",
                }}
              >
                <Star className="size-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              </motion.span>
            ))}
          </div>

          <p className="mb-6 text-sm leading-relaxed text-ink-soft sm:text-base">
            {testimonial.quote.split(testimonial.highlight).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="font-semibold text-brand-ink">{testimonial.highlight}</span>
                )}
              </span>
            ))}
          </p>

          <div className="flex items-center gap-3 border-t border-hairline/60 pt-4">
            <motion.div
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/80 text-sm font-semibold text-primary-foreground"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {testimonial.avatar}
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{testimonial.name}</p>
              <p className="text-xs text-ink-muted">{testimonial.role}</p>
            </div>
          </div>

          <motion.div
            className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            initial={false}
          />
        </motion.div>
      </motion.div>
    </Reveal>
  );
}

export function TestimonialsSection({ dict }: { dict: Dictionary }) {
  const copy = dict.testimonials;

  return (
    <section className="em-section relative overflow-hidden" id="testimonials">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(16,185,129,0.07),transparent_75%)]" />
        <div className="em-grid-lines absolute inset-0 opacity-30" />
      </div>

      <div className="em-container">
        <Reveal>
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>

        <Reveal delay={0.5} className="mt-16">
          <div className="rounded-2xl border border-hairline bg-surface-raised/30 p-8 text-center">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="size-5 fill-yellow-400 text-yellow-400"
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-2xl font-bold text-ink">{copy.ratingValue}</p>
            <p className="mt-2 text-sm text-ink-soft">{copy.ratingNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
