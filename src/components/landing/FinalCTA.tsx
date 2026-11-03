import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";

export function FinalCTA({ dict }: { dict: Dictionary }) {
  const final = dict.final;

  return (
    <section id="start" className="relative px-5 pb-20 pt-6 sm:px-8 sm:pb-24 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[28px] border border-hairline-strong/70 bg-surface-deep px-5 py-16 text-center sm:px-10 sm:py-20 md:rounded-[34px] md:py-24">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_80%_at_50%_-10%,rgba(5,150,105,0.16),transparent_68%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_85%_100%,rgba(22,168,117,0.1),transparent_70%)]" />
              <div className="em-grid-lines absolute inset-0 opacity-50" />
              <div className="absolute -bottom-28 left-1/2 size-[440px] -translate-x-1/2 rounded-full border border-brand/10" />
              <div className="absolute -bottom-20 left-1/2 size-[300px] -translate-x-1/2 rounded-full border border-brand/[0.07]" />
              <div className="em-noise" />
            </div>

            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3.5 py-1.5 text-[12px] font-medium text-brand-ink/95">
                <Sparkles className="size-3" aria-hidden="true" />
                {final.eyebrow}
              </span>

              <p
                dir="auto"
                className="mt-6 text-balance text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft sm:text-[14px]"
              >
                {final.englishHeadline}
              </p>

              <h2 className="mt-4 text-balance text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.14] tracking-[-0.04em]">
                <span className="em-text-gradient">{final.title}</span>
              </h2>

              <p className="mt-5 max-w-md text-pretty text-[14px] leading-[1.9] text-ink-soft sm:text-[15px]">
                {final.description}
              </p>

              <CtaLink href="#learning-preview" size="lg" className="mt-8 min-w-[240px]" withArrow>
                {final.cta}
              </CtaLink>

              <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted">
                <ArrowUpRight className="size-3 text-brand-ink/70" aria-hidden="true" />
                {final.note}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="absolute left-5 top-5 size-2 border-s border-t border-brand/30 sm:left-7 sm:top-7"
            />
            <span
              aria-hidden="true"
              className="absolute right-5 top-5 size-2 border-e border-t border-brand/30 sm:right-7 sm:top-7"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-5 left-5 size-2 border-b border-s border-brand/30 sm:bottom-7 sm:left-7"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-5 right-5 size-2 border-b border-e border-brand/30 sm:bottom-7 sm:right-7"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
