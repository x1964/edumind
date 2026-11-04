"use client";

import { Star, Quote } from "lucide-react";
import type { Dictionary, TestimonialItem } from "@/lib/i18n";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const RATING = 5;

function TestimonialCard({ testimonial, index }: { testimonial: TestimonialItem; index: number }) {
  return (
    <Reveal delay={Math.min(index * 0.06, 0.3)} className="h-full">
      <figure className="relative flex h-full flex-col rounded-2xl border border-hairline bg-surface-raised/50 p-6 transition-all duration-300 hover:border-brand/25 hover:bg-surface-raised/80 hover:shadow-card">
        <Quote className="absolute end-5 top-5 size-7 text-brand/15" aria-hidden="true" />

        <div className="flex gap-0.5" aria-label={`${RATING}/5`}>
          {[...Array(RATING)].map((_, i) => (
            <Star key={i} className="size-3.5 fill-brand/80 text-brand/80" aria-hidden="true" />
          ))}
        </div>

        <blockquote className="mt-4 flex-1 text-[13.5px] leading-[1.85] text-ink-soft">
          {testimonial.quote.split(testimonial.highlight).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="font-semibold text-brand-ink">{testimonial.highlight}</span>
              )}
            </span>
          ))}
        </blockquote>

        <figcaption className="mt-5 flex items-center gap-3 border-t border-hairline/60 pt-4">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full border border-brand/20 bg-brand/[0.08] text-[12px] font-semibold text-brand-ink"
            aria-hidden="true"
          >
            {testimonial.avatar}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {testimonial.name}
            </span>
            <span className="block truncate text-[12px] text-ink-muted">{testimonial.role}</span>
          </span>
        </figcaption>
      </figure>
    </Reveal>
  );
}

export function TestimonialsSection({ dict }: { dict: Dictionary }) {
  const copy = dict.testimonials;

  return (
    <section className="em-section relative overflow-hidden" id="testimonials">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(16,185,129,0.07),transparent_75%)]" />
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>

        <Reveal delay={0.2} className="mt-12">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface-raised/30 px-6 py-7 text-center sm:flex-row sm:justify-center sm:gap-5 sm:text-start">
            <div className="flex gap-1" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-brand/80 text-brand/80" />
              ))}
            </div>
            <span className="hidden h-8 w-px bg-hairline sm:block" aria-hidden="true" />
            <p className="text-[13px] text-ink-soft">
              <span className="em-num me-2 text-[17px] font-semibold text-ink" dir="auto">
                {copy.ratingValue}
              </span>
              {copy.ratingNote}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
