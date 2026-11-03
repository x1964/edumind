import { Check, FileText, ListChecks, MessageSquareText, Route, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export function ProductPreview({ dict }: { dict: Dictionary }) {
  const p = dict.productPreview;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <figure className="relative mx-auto w-full max-w-[580px] xl:max-w-none">
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-10 -top-10 bottom-8 rounded-[40px] bg-[radial-gradient(65%_55%_at_60%_30%,rgba(5,150,105,0.13),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="em-dot-grid absolute -inset-x-6 -inset-y-8 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_72%)]"
      />

      <div className="relative">
        <div className="em-window-shadow relative overflow-hidden rounded-[22px] border border-hairline-strong/70 bg-background">
          {/* Window chrome */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline/70 bg-black/[0.018] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-black/15" />
                <span className="size-2 rounded-full bg-black/10" />
                <span className="size-2 rounded-full bg-black/10" />
              </div>
              <span className="h-3 w-px bg-hairline" aria-hidden="true" />
              <span className="font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase">
                edumind / workspace
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-black/[0.03] px-2 py-1 text-[9.5px] font-medium text-ink-soft">
              <span
                className="size-1.5 rounded-full bg-brand em-animate-pulse-soft"
                aria-hidden="true"
              />
              {p.demoNote}
            </span>
          </div>

          <div className="space-y-2.5 p-3 sm:p-4">
            {/* File processing */}
            <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-3.5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand-ink">
                  <FileText className="size-[18px]" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink" dir="ltr">
                        {p.fileName}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">{p.fileMeta}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-ink-muted" dir="ltr">
                      {p.fileSize}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="inline-flex items-center gap-1.5 text-ink-soft">
                        <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
                        {p.status}
                      </span>
                      <span className="font-mono text-brand-ink">{p.progress}</span>
                    </div>
                    <div
                      className="relative h-[5px] overflow-hidden rounded-full bg-black/[0.06]"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={68}
                      aria-label={p.status}
                    >
                      <div className="absolute inset-y-0 start-0 w-[68%] rounded-full bg-[linear-gradient(90deg,#16a875,#059669)]" />
                      <div className="em-animate-pulse-soft absolute inset-y-0 start-[66%] w-3 rounded-full bg-[#b8ffe4] blur-[3px]" />
                    </div>
                    <p className="mt-2 truncate text-[10px] text-ink-muted">{p.statusNote}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {p.steps.map((step, index) => (
                        <span
                          key={step}
                          className="inline-flex items-center gap-1 rounded-full border border-hairline/80 bg-black/[0.02] px-2 py-0.5 text-[9.5px] text-ink-muted"
                        >
                          {index < 2 ? (
                            <Check className="size-2.5 text-brand-ink" aria-hidden="true" />
                          ) : (
                            <span
                              className="size-1 rounded-full bg-ink-muted/60"
                              aria-hidden="true"
                            />
                          )}
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-[1.22fr_1fr]">
              {/* AI Tutor */}
              <div className="flex flex-col rounded-2xl border border-hairline bg-surface-raised/70 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-brand/12 text-brand-ink">
                    <MessageSquareText className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium text-ink">{p.tutorLabel}</span>
                  <span className="ms-auto inline-flex items-center gap-1 text-[9px] text-brand-ink/90">
                    <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
                    AI
                  </span>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-[1.85] text-ink-soft">
                  {p.tutorMessage}
                </p>
                <div className="mt-auto flex items-center gap-2 rounded-xl border border-hairline/70 bg-surface-deep px-2.5 py-2">
                  <span className="min-w-0 flex-1 truncate text-[10px] text-ink-muted">
                    {p.tutorPrompt}
                  </span>
                  <span className="grid size-5 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-ink">
                    <Sparkles className="size-2.5" aria-hidden="true" />
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Summary */}
                <div className="rounded-2xl border border-hairline bg-surface-raised/70 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-lg bg-black/[0.05] text-ink-soft">
                      <ListChecks className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium text-ink">{p.summaryLabel}</span>
                  </div>
                  <p className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                    {p.summaryTitle}
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {p.summaryPoints.map((point) => (
                      <li
                        key={point}
                        className="flex gap-1.5 text-[10px] leading-[1.65] text-ink-soft"
                      >
                        <span
                          className="mt-[5px] size-1 shrink-0 rounded-full bg-brand/70"
                          aria-hidden="true"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quiz */}
                <div className="rounded-2xl border border-brand/20 bg-[linear-gradient(145deg,rgba(5,150,105,0.07),rgba(5,150,105,0.06))] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-ink">{p.quizLabel}</span>
                    <span className="font-mono text-[9px] text-ink-muted">{p.quizFooter}</span>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-[1.6] text-ink-soft">
                    {p.quizQuestion}
                  </p>
                  <div className="mt-2 space-y-1">
                    {p.quizOptions.map((option, index) => (
                      <div
                        key={option}
                        className={
                          index === p.quizCorrectIndex
                            ? "flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/[0.08] px-2 py-1 text-[9.5px] text-brand-ink"
                            : "flex items-center gap-1.5 rounded-lg border border-hairline/60 bg-black/[0.015] px-2 py-1 text-[9.5px] text-ink-muted"
                        }
                      >
                        <span
                          className={
                            index === p.quizCorrectIndex
                              ? "grid size-3 place-items-center rounded-full bg-brand text-primary-foreground"
                              : "size-3 rounded-full border border-hairline-strong"
                          }
                          aria-hidden="true"
                        >
                          {index === p.quizCorrectIndex ? <Check className="size-2" /> : null}
                        </span>
                        <span className="truncate">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding progress */}
            <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-black/[0.018] px-3.5 py-2.5">
              <svg viewBox="0 0 44 44" className="size-9 -rotate-90" aria-hidden="true">
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  fill="none"
                  stroke="rgba(15,23,42,0.08)"
                  strokeWidth="3"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * 0.28}
                />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-medium text-ink-soft">
                    {p.understandingLabel}
                  </span>
                  <span className="font-mono text-[11px] text-brand-ink">
                    {p.understandingValue}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[9.5px] text-ink-muted">{p.demoNote}</p>
              </div>
              <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
                {[34, 52, 44, 68, 58, 76, 88].map((height, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-sm bg-brand/30 last:bg-brand/80"
                    style={{ height: `${Math.round(height / 3)}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating cards */}
        <div className="em-animate-float absolute -top-[86px] start-6 hidden w-[164px] rounded-xl border border-hairline-strong/80 bg-white/95 p-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.16)] backdrop-blur-md xl:block">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-brand/12 text-brand-ink">
              <Route className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-medium text-ink">{p.floatPlan}</span>
          </div>
          <p className="mt-1.5 text-[9px] text-ink-muted">{p.floatPlanMeta}</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            <span className="h-1 flex-1 rounded-full bg-brand/70" />
            <span className="h-1 flex-1 rounded-full bg-brand/40" />
            <span className="h-1 flex-1 rounded-full bg-black/10" />
          </div>
        </div>

        <div className="em-animate-float-slow absolute -end-3 bottom-[20%] hidden items-center gap-2 rounded-xl border border-hairline-strong/80 bg-white/95 px-3 py-2.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.16)] backdrop-blur-md xl:flex">
          <span className="grid size-6 place-items-center rounded-lg bg-black/[0.05] text-ink-soft">
            <Sparkles className="size-3" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-medium text-ink">{p.floatContext}</p>
            <p className="text-[9px] text-ink-muted">{p.floatContextMeta}</p>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-muted">
        <span className="size-1 rounded-full bg-brand/60" aria-hidden="true" />
        {p.demoNote}
      </figcaption>
    </figure>
  );
}
