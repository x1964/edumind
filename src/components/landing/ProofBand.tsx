import { Check } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Reveal } from "./Reveal";

export function ProofBand({ dict }: { dict: Dictionary }) {
  const copy = dict.proof;

  return (
    <section className="relative overflow-hidden border-y border-hairline bg-surface-raised/30 py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_85%_0%,rgba(5,150,105,0.07),transparent_70%)]" />
        <div className="em-grid-lines absolute inset-0 opacity-35" />
      </div>

      <div className="em-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.22em] text-brand-ink/90">
              <span className="h-px w-6 bg-brand/60" aria-hidden="true" />
              {copy.eyebrow}
            </span>
            <h2 className="mt-4 max-w-md text-balance text-[clamp(1.75rem,3.4vw,2.6rem)] font-semibold leading-[1.2] tracking-[-0.04em] text-ink">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-[14px] leading-[1.9] text-ink-soft">
              {copy.description}
            </p>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {copy.items.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.06}>
                <div className="group flex h-full flex-col rounded-2xl border border-hairline bg-background/70 p-5 transition-all duration-300 hover:border-brand/25 hover:bg-background hover:shadow-card">
                  <div className="flex items-baseline gap-1" dir="auto">
                    <span className="em-num text-[34px] font-semibold leading-none tracking-[-0.05em] text-brand-ink sm:text-[38px]">
                      {item.value}
                    </span>
                    {item.suffix ? (
                      <span className="text-[15px] font-semibold text-brand-ink/80">
                        {item.suffix}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[13.5px] font-medium text-ink">{item.label}</p>
                  <p className="mt-1 text-[12px] leading-[1.75] text-ink-muted">{item.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="mt-10">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-2xl border border-hairline/70 bg-background/50 px-5 py-4">
            {copy.trust.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                <span
                  className="grid size-4 place-items-center rounded-full border border-brand/25 bg-brand/[0.08] text-brand-ink"
                  aria-hidden="true"
                >
                  <Check className="size-2.5" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
