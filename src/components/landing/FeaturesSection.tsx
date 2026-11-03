"use client";

import {
  ChartNoAxesColumn,
  Check,
  CircleCheck,
  Eye,
  FileText,
  Headphones,
  ListChecks,
  MessageSquareText,
  Network,
  Play,
  Route,
  Sparkles,
} from "lucide-react";
import type { Dictionary, FeatureId } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const icons: Record<FeatureId, typeof Sparkles> = {
  tutor: MessageSquareText,
  summary: ListChecks,
  quiz: CircleCheck,
  mindmap: Network,
  visual: Eye,
  audio: Headphones,
  path: Route,
  analytics: ChartNoAxesColumn,
};

function SummaryVisual({ dict }: { dict: Dictionary }) {
  const p = dict.productPreview;
  return (
    <div className="mt-4 rounded-xl border border-hairline/80 bg-surface-deep p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          {p.summaryTitle}
        </span>
        <Sparkles className="size-2.5 text-brand-ink/70" aria-hidden="true" />
      </div>
      <div className="mt-2 space-y-1.5" aria-hidden="true">
        <div className="h-1 w-full rounded-full bg-black/12" />
        <div className="h-1 w-[82%] rounded-full bg-black/8" />
        <div className="h-1 w-[64%] rounded-full bg-black/6" />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {dict.learning.summary.terms.slice(0, 2).map((term) => (
          <span
            key={term}
            className="rounded border border-brand/15 bg-brand/[0.05] px-1.5 py-0.5 text-[8.5px] text-brand-ink/80"
          >
            {term}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuizVisual({ dict }: { dict: Dictionary }) {
  const p = dict.productPreview;
  return (
    <div className="mt-4 rounded-xl border border-hairline/80 bg-surface-deep p-3">
      <p className="text-[9.5px] leading-snug text-ink-soft">{p.quizQuestion}</p>
      <div className="mt-2 space-y-1">
        {p.quizOptions.map((option, index) => (
          <div
            key={option}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[8.5px]",
              index === p.quizCorrectIndex
                ? "border-brand/30 bg-brand/[0.08] text-brand-ink"
                : "border-hairline/60 text-ink-muted"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                index === p.quizCorrectIndex ? "bg-brand" : "border border-hairline-strong"
              )}
              aria-hidden="true"
            />
            <span className="truncate">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MindMapVisual({ dict }: { dict: Dictionary }) {
  const branches = dict.learning.mindmap.branches.slice(0, 4);
  return (
    <div
      className="relative mt-4 h-[96px] rounded-xl border border-hairline/80 bg-surface-deep"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 100"
        className="absolute inset-0 size-full text-brand-ink"
        preserveAspectRatio="none"
      >
        <line x1="100" y1="50" x2="46" y2="24" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="100" y1="50" x2="154" y2="24" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="100" y1="50" x2="46" y2="76" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="100" y1="50" x2="154" y2="76" stroke="currentColor" strokeOpacity="0.25" />
      </svg>
      <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/50 bg-brand/30" />
      {branches.map((branch, index) => (
        <span
          key={branch.label}
          className={cn(
            "absolute max-w-[58px] truncate rounded border border-hairline bg-surface-high/90 px-1.5 py-0.5 text-[7.5px] text-ink-soft",
            index === 0 && "left-2 top-3",
            index === 1 && "right-2 top-3",
            index === 2 && "left-2 bottom-3",
            index === 3 && "right-2 bottom-3"
          )}
        >
          {branch.label}
        </span>
      ))}
    </div>
  );
}

function VisualLearningMock({ dict }: { dict: Dictionary }) {
  return (
    <div className="relative mt-4 h-[96px] overflow-hidden rounded-xl border border-hairline/80 bg-surface-deep p-2">
      <svg viewBox="0 0 200 90" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="visual-curve" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="16" y1="76" x2="188" y2="76" stroke="rgba(15,23,42,0.12)" />
        <line x1="16" y1="10" x2="16" y2="76" stroke="rgba(15,23,42,0.12)" />
        <path d="M16 70 Q 70 66 100 44 T 184 18 L184 76 L16 76 Z" fill="url(#visual-curve)" />
        <path
          d="M16 70 Q 70 66 100 44 T 184 18"
          fill="none"
          stroke="#059669"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="100" cy="44" r="2.6" fill="#059669" />
        <circle cx="100" cy="44" r="6" fill="none" stroke="#059669" strokeOpacity="0.28" />
      </svg>
      <span className="absolute bottom-2 start-3 font-mono text-[8px] text-ink-muted" dir="ltr">
        {dict.subjects.items[0].visualCaption}
      </span>
    </div>
  );
}

function AudioVisual({ dict }: { dict: Dictionary }) {
  const heights = [38, 68, 48, 88, 58, 76, 42, 70, 52, 82, 34, 62, 46, 74, 40, 58];
  return (
    <div className="mt-auto flex items-center gap-3 pt-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/[0.08] text-brand-ink">
        <Play className="size-3.5 fill-current" aria-hidden="true" />
      </span>
      <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
        {heights.map((height, index) => (
          <span
            key={index}
            className="w-[3px] shrink-0 rounded-full bg-brand/45"
            style={{
              height: `${height / 2.4}px`,
              backgroundColor: index > 8 ? "rgba(5,150,105,0.25)" : undefined,
            }}
          />
        ))}
      </div>
      <span className="shrink-0 text-[9px] text-ink-muted">{dict.features.items[5].tag}</span>
    </div>
  );
}

function PathVisual({ dict }: { dict: Dictionary }) {
  const p = dict.productPreview;
  return (
    <div className="mt-4 rounded-xl border border-hairline/80 bg-surface-deep p-3">
      <div className="flex items-center justify-between text-[9px] text-ink-soft">
        <span>{p.floatPlan}</span>
        <span className="text-[8px] text-ink-muted">{p.floatPlanMeta}</span>
      </div>
      <div className="mt-3 flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((step) => (
          <div key={step} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border text-[7px]",
                step < 2
                  ? "border-brand/40 bg-brand/15 text-brand-ink"
                  : "border-hairline-strong text-ink-muted"
              )}
            >
              {step < 2 ? <Check className="size-2" /> : step + 1}
            </span>
            {step < 2 ? <span className="h-px flex-1 bg-brand/30" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual({ dict }: { dict: Dictionary }) {
  const bars = [42, 58, 48, 74, 66, 88, 78];
  return (
    <div className="mt-4 rounded-xl border border-hairline/80 bg-surface-deep p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-ink-muted">{dict.productPreview.understandingLabel}</span>
        <span className="font-mono text-[10px] text-brand-ink">
          {dict.productPreview.understandingValue}
        </span>
      </div>
      <div className="mt-2.5 flex h-12 items-end gap-1.5" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-sm",
              index === bars.length - 2 ? "bg-brand/70" : "bg-black/10"
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureVisual({ id, dict }: { id: FeatureId; dict: Dictionary }) {
  switch (id) {
    case "summary":
      return <SummaryVisual dict={dict} />;
    case "quiz":
      return <QuizVisual dict={dict} />;
    case "mindmap":
      return <MindMapVisual dict={dict} />;
    case "visual":
      return <VisualLearningMock dict={dict} />;
    case "audio":
      return <AudioVisual dict={dict} />;
    case "path":
      return <PathVisual dict={dict} />;
    case "analytics":
      return <AnalyticsVisual dict={dict} />;
    default:
      return null;
  }
}

export function FeaturesSection({ dict }: { dict: Dictionary }) {
  const features = dict.features;

  return (
    <section id="features" className="em-section relative">
      <div className="em-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow={features.eyebrow}
              title={features.title}
              description={features.description}
            />
          </Reveal>
          <Reveal delay={0.08} className="hidden items-center gap-2 lg:flex">
            <span className="font-mono text-[11px] text-ink-muted">08</span>
            <span className="h-px w-10 bg-hairline-strong" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              {features.eyebrow}
            </span>
          </Reveal>
        </div>

        <div className="mt-12 grid auto-rows-[minmax(0,auto)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.items.map((feature, index) => {
            const Icon = icons[feature.id];
            const isTutor = feature.id === "tutor";
            const isAudio = feature.id === "audio";

            return (
              <Reveal
                key={feature.id}
                delay={Math.min(index * 0.05, 0.3)}
                className={cn(isTutor && "sm:col-span-2 lg:row-span-2", isAudio && "sm:col-span-2")}
              >
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-raised/45 p-5 transition-colors duration-200 hover:border-brand/25 hover:bg-surface-raised/70",
                    isTutor && "em-surface-gradient p-5 sm:p-6 lg:p-7"
                  )}
                >
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-hairline bg-black/[0.03] text-brand-ink">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                      {feature.tag}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "relative mt-4 font-semibold leading-snug tracking-tight text-ink",
                      isTutor ? "text-[19px] sm:text-[22px]" : "text-[14.5px]"
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={cn(
                      "relative mt-1.5 leading-[1.8] text-ink-soft",
                      isTutor ? "max-w-md text-[12.5px] sm:text-[13px]" : "text-[11.5px]"
                    )}
                  >
                    {feature.description}
                  </p>

                  {isTutor ? (
                    <div className="relative mt-5 flex flex-1 flex-col gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-brand/20 bg-brand/[0.08] text-brand-ink">
                          <Sparkles className="size-3.5" aria-hidden="true" />
                        </span>
                        <div className="rounded-xl rounded-ss-sm border border-hairline bg-black/[0.02] p-3">
                          <p className="text-[11.5px] leading-[1.85] text-ink-soft">
                            {dict.productPreview.tutorMessage}
                          </p>
                        </div>
                      </div>
                      <div className="ms-auto max-w-[85%] rounded-xl rounded-se-sm border border-brand/15 bg-brand/[0.05] px-3 py-2">
                        <p className="text-[11px] text-ink-soft">
                          {dict.learning.explanation.chips[2]}
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-brand/20 bg-brand/[0.08] text-brand-ink">
                          <Sparkles className="size-3.5" aria-hidden="true" />
                        </span>
                        <div className="rounded-xl rounded-ss-sm border border-hairline bg-black/[0.02] p-3">
                          <p className="text-[11.5px] leading-[1.85] text-ink-soft">
                            {dict.learning.explanation.example}
                          </p>
                          <div className="mt-2.5 flex items-center gap-1.5 border-t border-hairline/60 pt-2 text-[9px] text-ink-muted">
                            <FileText
                              className="size-2.5 shrink-0 text-brand-ink/70"
                              aria-hidden="true"
                            />
                            <span className="truncate">{dict.productPreview.fileName}</span>
                            <span className="ms-auto shrink-0 opacity-70">
                              {dict.learning.lessonMeta}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                        {dict.learning.explanation.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-hairline bg-black/[0.02] px-2.5 py-1 text-[10px] text-ink-muted"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-hairline bg-surface-deep px-3 py-2.5">
                        <span className="flex-1 truncate text-[10.5px] text-ink-muted">
                          {dict.productPreview.tutorPrompt}
                        </span>
                        <span className="grid size-5 place-items-center rounded-lg bg-brand text-primary-foreground">
                          <Sparkles className="size-2.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex flex-1 flex-col">
                      <FeatureVisual id={feature.id} dict={dict} />
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
