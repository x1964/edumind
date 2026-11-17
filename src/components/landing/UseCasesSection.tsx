import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function UseCasesSection({ dict }: { dict: Dictionary }) {
  const copy = dict.useCases;

  return (
    <section className="em-section relative overflow-hidden" id="use-cases">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/3 h-[520px] bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(16,185,129,0.06),transparent_75%)]" />
      </div>

      <div className="em-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow={copy.eyebrow}
              title={copy.title}
              description={copy.description}
            />
          </Reveal>
          <Reveal delay={0.08} className="hidden shrink-0 lg:block">
            <CtaLink href="/signup" variant="secondary" withArrow>
              {dict.nav.getStarted}
            </CtaLink>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {copy.items.map((item, index) => (
            <Reveal key={item.title} delay={Math.min(index * 0.07, 0.28)}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-raised/40 p-6 transition-all duration-300 hover:border-brand/25 hover:bg-surface-raised/70 hover:shadow-card sm:p-7">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-6 end-4 font-mono text-[72px] font-semibold leading-none tracking-tighter text-black/[0.025] transition-colors duration-300 group-hover:text-brand-ink/[0.05]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 py-1 text-[11.5px] font-medium text-brand-ink">
                  <Sparkles className="size-2.5" aria-hidden="true" />
                  {item.tag}
                </span>

                <h3 className="relative mt-4 max-w-md text-[18px] font-semibold leading-snug tracking-tight text-ink sm:text-[19px]">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-md text-[13px] leading-[1.85] text-ink-soft">
                  {item.scenario}
                </p>

                <ol className="mt-5 grid gap-2">
                  {item.steps.map((step, stepIndex) => (
                    <li key={step} className="flex items-start gap-2.5 text-[12.5px] text-ink-soft">
                      <span
                        className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-hairline-strong bg-black/[0.02] font-mono text-[10.5px] text-ink-muted"
                        aria-hidden="true"
                      >
                        {stepIndex + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-5 flex items-center gap-1.5 border-t border-hairline/60 pt-3.5 text-[12px] font-medium text-brand-ink/90">
                  <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                  {item.highlight}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-hairline bg-surface-deep px-5 py-4 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">{copy.note}</p>
            <CtaLink href="/signup" size="md" className="shrink-0" withArrow>
              {dict.nav.getStarted}
            </CtaLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
