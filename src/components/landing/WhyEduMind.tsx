import { Quote, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Reveal } from "./Reveal";

export function WhyEduMind({ dict }: { dict: Dictionary }) {
  const why = dict.why;
  const words = why.title.split(" ");
  const lastWord = words.pop() ?? "";
  const lead = words.join(" ");

  return (
    <section id="why-edumind" className="em-section relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_60%_45%_at_20%_50%,rgba(5,150,105,0.055),transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 end-0 select-none font-mono text-[clamp(5rem,16vw,13rem)] font-semibold leading-none tracking-tighter text-black/[0.018]"
      >
        UNDERSTAND
      </span>

      <div className="em-container">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          <div className="flex flex-col">
            <Reveal>
              <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-ink/90">
                <span className="h-px w-6 bg-brand/60" aria-hidden="true" />
                {why.eyebrow}
              </span>
              <h2 className="mt-5 max-w-xl text-balance text-[clamp(2rem,4.3vw,3.35rem)] font-semibold leading-[1.16] tracking-[-0.04em] text-ink">
                {lead} <span className="em-text-gradient">{lastWord}</span>
              </h2>
              <p className="mt-5 max-w-md text-pretty text-[14px] leading-[1.95] text-ink-soft md:text-[15px]">
                {why.description}
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-10 lg:mt-auto lg:pt-16">
              <div className="relative max-w-md overflow-hidden rounded-2xl border border-hairline bg-surface-raised/40 p-5">
                <Quote className="size-5 text-brand-ink/50" aria-hidden="true" strokeWidth={1.5} />
                <p className="mt-3 text-[17px] font-medium leading-[1.55] tracking-tight text-ink">
                  {why.closingTop} <span className="text-brand-ink">{why.closingAccent}</span>
                </p>
                <div className="mt-4 flex items-start gap-2 border-t border-hairline/70 pt-3.5">
                  <Sparkles
                    className="mt-0.5 size-3 shrink-0 text-brand-ink/70"
                    aria-hidden="true"
                  />
                  <p className="text-[11.5px] leading-relaxed text-ink-muted">{why.closingNote}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-x-10 border-b border-hairline md:grid-cols-2">
            {why.points.map((point, index) => (
              <Reveal key={point.title} delay={Math.min(index * 0.06, 0.3)}>
                <div className="group border-t border-hairline py-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-brand-ink/60 transition-colors group-hover:text-brand-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px w-8 bg-hairline-strong transition-all duration-300 group-hover:w-14 group-hover:bg-brand/40"
                    />
                  </div>
                  <h3 className="mt-2 text-[15px] font-medium leading-snug text-ink transition-transform duration-300 group-hover:-translate-y-0.5">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-[1.85] text-ink-soft">
                    {point.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
