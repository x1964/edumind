import { Route, ScanText, Sparkles, Upload } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const icons = [Upload, ScanText, Route];

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["PDF", "DOCX", "TXT"].map((format) => (
          <span
            key={format}
            className="rounded-md border border-hairline bg-black/[0.02] px-2 py-1 font-mono text-[12px] tracking-wide text-ink-muted"
          >
            {format}
          </span>
        ))}
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-5 space-y-2" aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand/70" />
          <span className="h-1 w-[54%] rounded-full bg-black/15" />
          <span className="ms-auto font-mono text-[12px] text-ink-muted/60">01</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand/40" />
          <span className="h-1 w-[72%] rounded-full bg-black/10" />
          <span className="ms-auto font-mono text-[12px] text-ink-muted/60">02</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-surface-deep" />
          <span className="h-1 w-[40%] rounded-full bg-black/[0.07]" />
          <span className="ms-auto font-mono text-[12px] text-ink-muted/60">03</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {["شرح", "ملخص", "اختبار", "خريطة"].map((tool) => (
        <span
          key={tool}
          className="rounded-md border border-hairline bg-black/[0.02] px-2 py-1 text-[12px] text-ink-muted"
        >
          {tool}
        </span>
      ))}
    </div>
  );
}

export function HowItWorks({ dict }: { dict: Dictionary }) {
  const how = dict.how;

  return (
    <section id="how-it-works" className="em-section relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[420px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(22,168,117,0.06),transparent_70%)]"
      />
      <div className="em-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading eyebrow={how.eyebrow} title={how.title} description={how.description} />
          </Reveal>
          <Reveal delay={0.08} className="hidden shrink-0 pb-2 md:block">
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-black/[0.02] px-3.5 py-2 text-[12px] text-ink-muted">
              <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
              {how.footnote}
            </span>
          </Reveal>
        </div>

        <div className="relative mt-12 md:mt-16">
          <div
            aria-hidden="true"
            className="absolute inset-x-[8%] top-[30px] hidden border-t border-dashed border-hairline-strong/70 md:block"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {how.steps.map((step, index) => {
              const Icon = icons[index];
              return (
                <Reveal key={step.number} delay={index * 0.1} y={26}>
                  <article className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-background p-5 transition-colors duration-300 hover:border-brand/25 hover:bg-muted md:pt-0">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-4 end-3 font-mono text-[70px] font-semibold leading-none tracking-tighter text-black/[0.025] transition-colors duration-300 group-hover:text-brand-ink/[0.045]"
                    >
                      {step.number}
                    </span>

                    <div className="relative flex items-center justify-between md:-mt-px">
                      <span className="relative grid size-[60px] place-items-center rounded-2xl border border-hairline-strong bg-muted text-brand-ink transition-transform duration-300 group-hover:-translate-y-0.5">
                        <Icon className="size-5" aria-hidden="true" />
                        <span className="absolute -top-2 -end-2 rounded-full border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink-muted">
                          {step.number}
                        </span>
                      </span>
                      <span className="hidden font-mono text-[12px] uppercase tracking-[0.18em] text-ink-muted md:block">
                        {step.english}
                      </span>
                    </div>

                    <div className="relative mt-5">
                      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-brand-ink/80 md:hidden">
                        {step.english}
                      </p>
                      <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight text-ink md:text-[18px]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.85] text-ink-soft">
                        {step.description}
                      </p>
                      <StepVisual index={index} />
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={0.1} className="mt-6 md:hidden">
          <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-black/[0.02] px-3.5 py-2 text-[12px] text-ink-muted">
            <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
            {how.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
