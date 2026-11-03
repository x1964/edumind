"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Network,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

type TabKey = "explanation" | "summary" | "quiz" | "mindmap";

const TAB_ORDER: TabKey[] = ["explanation", "summary", "quiz", "mindmap"];

export function LearningPreview({ dict }: { dict: Dictionary }) {
  const [tab, setTab] = useState<TabKey>("explanation");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [branch, setBranch] = useState(0);
  const reduceMotion = useReducedMotion();
  const learning = dict.learning;

  const tabsMeta: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
    { key: "explanation", label: learning.tabs.explanation, icon: MessageSquareText },
    { key: "summary", label: learning.tabs.summary, icon: ListChecks },
    { key: "quiz", label: learning.tabs.quiz, icon: CircleCheck },
    { key: "mindmap", label: learning.tabs.mindmap, icon: Network },
  ];

  const questions = learning.quiz.questions;
  const question = questions[quizIndex];
  const isLast = quizIndex === questions.length - 1;

  function selectOption(index: number) {
    if (selected !== null) return;
    setSelected(index);
    if (index === question.correct) setScore((value) => value + 1);
  }

  function nextQuestion() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setQuizIndex((value) => value + 1);
    setSelected(null);
  }

  function resetQuiz() {
    setQuizIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: TabKey) {
    const isRtl = document.documentElement.dir === "rtl";
    const currentIndex = TAB_ORDER.indexOf(key);
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex =
        (currentIndex + (isRtl && event.key === "ArrowRight" ? -1 : 1) + TAB_ORDER.length) %
        TAB_ORDER.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - (isRtl && event.key === "ArrowLeft" ? -1 : 1) + TAB_ORDER.length) %
        TAB_ORDER.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextKey = TAB_ORDER[nextIndex];
    setTab(nextKey);
    document.getElementById(`learning-tab-${nextKey}`)?.focus();
  }

  return (
    <section id="learning-preview" className="em-section">
      <div className="em-container">
        <Reveal>
          <SectionHeading
            eyebrow={learning.eyebrow}
            title={learning.title}
            description={learning.description}
            align="center"
            className="max-w-3xl"
          />
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <div className="relative overflow-hidden rounded-[26px] border border-hairline bg-background em-window-shadow">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_80%_0%,rgba(5,150,105,0.09),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative grid lg:grid-cols-[292px_minmax(0,1fr)]">
              <aside className="flex min-w-0 flex-col gap-5 border-b border-hairline bg-black/[0.015] p-5 sm:p-6 lg:border-b-0 lg:border-e">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                    <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
                    EduMind workspace
                  </span>
                  <h3 className="mt-3 text-[17px] font-medium leading-snug text-ink">
                    {learning.lessonTitle}
                  </h3>
                  <p className="mt-1 text-[11.5px] text-ink-muted">{learning.lessonMeta}</p>
                </div>

                <div className="hidden h-px w-full bg-hairline/80 lg:block" aria-hidden="true" />

                <div
                  role="tablist"
                  aria-label={learning.eyebrow}
                  aria-orientation="vertical"
                  className="em-scrollbar-none -mx-1 flex w-full min-w-0 gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
                >
                  {tabsMeta.map(({ key, label, icon: Icon }) => {
                    const active = tab === key;
                    return (
                      <button
                        key={key}
                        id={`learning-tab-${key}`}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        aria-controls={`learning-panel-${key}`}
                        tabIndex={active ? 0 : -1}
                        onClick={() => setTab(key)}
                        onKeyDown={(event) => onTabKeyDown(event, key)}
                        className={cn(
                          "group inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start text-[12.5px] font-medium transition-all duration-200",
                          active
                            ? "border-brand/25 bg-brand/[0.08] text-ink"
                            : "border-transparent text-ink-muted hover:bg-black/[0.03] hover:text-ink-soft"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-lg border transition-colors",
                            active
                              ? "border-brand/25 bg-brand/10 text-brand-ink"
                              : "border-hairline bg-black/[0.02] text-ink-muted group-hover:text-ink-soft"
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-auto hidden text-[10.5px] leading-relaxed text-ink-muted lg:block">
                  {learning.demoNote}
                </p>
              </aside>

              <div className="relative min-h-[460px] min-w-0 p-5 sm:p-7 lg:p-8">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={tab}
                    id={`learning-panel-${tab}`}
                    role="tabpanel"
                    aria-labelledby={`learning-tab-${tab}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {tab === "explanation" ? (
                      <ExplanationPanel learning={learning} />
                    ) : tab === "summary" ? (
                      <SummaryPanel learning={learning} />
                    ) : tab === "quiz" ? (
                      <QuizPanel
                        learning={learning}
                        quizIndex={quizIndex}
                        question={question}
                        selected={selected}
                        score={score}
                        finished={finished}
                        isLast={isLast}
                        onSelect={selectOption}
                        onNext={nextQuestion}
                        onReset={resetQuiz}
                      />
                    ) : (
                      <MindMapPanel learning={learning} branch={branch} onBranch={setBranch} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ExplainNote({
  label,
  text,
  icon,
  className,
}: {
  label: string;
  text: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-hairline bg-black/[0.02] p-4", className)}>
      <div className="flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="grid size-6 place-items-center rounded-md bg-black/[0.05] text-brand-ink">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.85] text-ink-soft">{text}</p>
    </div>
  );
}

function ExplanationPanel({ learning }: { learning: Dictionary["learning"] }) {
  const e = learning.explanation;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-ink/90">
          <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
          {e.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-black/[0.02] px-2 py-1 text-[9.5px] text-ink-muted">
          <Sparkles className="size-2.5 text-brand-ink/80" aria-hidden="true" />
          AI
        </span>
      </div>

      <p className="mt-5 max-w-2xl text-pretty text-[14px] leading-[2] text-ink-soft">{e.intro}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ExplainNote
          label={e.conceptLabel}
          text={e.concept}
          icon={<Lightbulb className="size-3.5" />}
        />
        <ExplainNote
          label={e.exampleLabel}
          text={e.example}
          icon={<Sparkles className="size-3.5" />}
          className="border-brand/20 bg-brand/[0.04]"
        />
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-hairline/70 bg-surface-deep px-4 py-3">
        <span className="mt-0.5 font-mono text-[10px] font-semibold text-brand-ink">!</span>
        <p className="text-[11.5px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink-soft">{e.noteLabel}: </span>
          {e.note}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <span className="text-[10.5px] font-medium text-ink-muted">{e.askLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {e.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-hairline bg-black/[0.02] px-3 py-1.5 text-[11px] text-ink-soft"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({ learning }: { learning: Dictionary["learning"] }) {
  const s = learning.summary;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-ink/90">
          <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
          {s.label}
        </span>
        <span className="text-[10px] text-ink-muted">{s.meta}</span>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {s.points.map((point, index) => (
          <div
            key={point.title}
            className="group rounded-xl border border-hairline bg-black/[0.02] p-4 transition-colors hover:border-brand/25 hover:bg-brand/[0.03]"
          >
            <span className="font-mono text-[10px] text-brand-ink/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h4 className="mt-2 text-[13px] font-medium text-ink">{point.title}</h4>
            <p className="mt-1.5 text-[11.5px] leading-[1.8] text-ink-soft">{point.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-hairline/70 bg-surface-deep p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {s.termsLabel}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {s.terms.map((term) => (
            <span
              key={term}
              className="rounded-md border border-brand/15 bg-brand/[0.05] px-2.5 py-1 text-[11px] text-brand-ink/90"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuizPanelProps {
  learning: Dictionary["learning"];
  quizIndex: number;
  question: Dictionary["learning"]["quiz"]["questions"][number];
  selected: number | null;
  score: number;
  finished: boolean;
  isLast: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
  onReset: () => void;
}

function QuizPanel({
  learning,
  quizIndex,
  question,
  selected,
  score,
  finished,
  isLast,
  onSelect,
  onNext,
  onReset,
}: QuizPanelProps) {
  const q = learning.quiz;

  if (finished) {
    const perfect = score === q.questions.length;
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/[0.08] text-brand-ink">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-ink">{q.resultsTitle}</h3>
        <p className="mt-2 text-[13px] text-ink-muted">
          {score} / {q.questions.length} {q.scoreLabel}
        </p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {q.questions.map((item, index) => (
            <span
              key={item.question}
              className={cn(
                "h-1.5 w-8 rounded-full",
                index < score ? "bg-brand" : "bg-black/10",
                perfect && "bg-brand"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-full border border-hairline-strong bg-black/[0.03] px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-brand/40 hover:bg-brand/[0.06]"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {q.retry}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-ink/90">
          <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
          {q.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted">
            {q.questionLabel} {quizIndex + 1} / {q.questions.length}
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            {q.questions.map((item, index) => (
              <span
                key={item.question}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === quizIndex
                    ? "w-6 bg-brand"
                    : index < quizIndex
                      ? "w-3 bg-brand/40"
                      : "w-3 bg-black/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <h3 className="mt-5 max-w-2xl text-pretty text-[18px] font-medium leading-snug text-ink sm:text-[20px]">
        {question.question}
      </h3>

      <div className="mt-4 grid gap-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correct;
          const isSelected = selected === index;
          const revealed = selected !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(index)}
              disabled={revealed}
              aria-pressed={isSelected}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-start text-[12.5px] transition-all duration-200",
                !revealed &&
                  "border-hairline bg-black/[0.02] text-ink-soft hover:border-brand/30 hover:bg-brand/[0.04] hover:text-ink",
                revealed && isCorrect && "border-brand/40 bg-brand/[0.07] text-ink",
                revealed &&
                  isSelected &&
                  !isCorrect &&
                  "border-[#ef4444]/40 bg-[#ef4444]/[0.06] text-ink",
                revealed &&
                  !isCorrect &&
                  !isSelected &&
                  "border-hairline/60 bg-transparent text-ink-muted opacity-55"
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px]",
                  revealed && isCorrect
                    ? "border-brand bg-brand text-primary-foreground"
                    : revealed && isSelected && !isCorrect
                      ? "border-[#ef4444] bg-[#ef4444] text-[#190a0b]"
                      : "border-hairline-strong text-ink-muted group-hover:border-brand/40"
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : revealed && isSelected && !isCorrect ? (
                  <X className="size-3" aria-hidden="true" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {selected !== null ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-hairline bg-black/[0.02] p-3.5">
              <p
                className={cn(
                  "text-[11.5px] font-medium",
                  selected === question.correct ? "text-brand-ink" : "text-danger"
                )}
              >
                {selected === question.correct ? q.correct : q.incorrect}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-[1.8] text-ink-soft">
                {question.explanation}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
              >
                {isLast ? q.seeResult : q.next}
                <ArrowRight className="size-3.5 rtl:hidden" aria-hidden="true" />
                <ArrowLeft className="size-3.5 ltr:hidden" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MindMapPanel({
  learning,
  branch,
  onBranch,
}: {
  learning: Dictionary["learning"];
  branch: number;
  onBranch: (index: number) => void;
}) {
  const m = learning.mindmap;
  const positions = [
    "start-[6%] top-[7%]",
    "end-[6%] top-[7%]",
    "start-0 top-[41%]",
    "end-0 top-[41%]",
    "bottom-[3%] left-1/2 -translate-x-1/2",
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-ink/90">
          <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
          {m.label}
        </span>
        <span className="text-[10px] text-ink-muted">{m.hint}</span>
      </div>

      <div
        className="relative mt-4 h-[270px] w-full select-none sm:h-[300px]"
        role="group"
        aria-label={m.label}
      >
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 size-full text-brand-ink"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="200"
            y1="150"
            x2="88"
            y2="58"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="4 5"
          />
          <line
            x1="200"
            y1="150"
            x2="312"
            y2="58"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="4 5"
          />
          <line
            x1="200"
            y1="150"
            x2="46"
            y2="140"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="4 5"
          />
          <line
            x1="200"
            y1="150"
            x2="354"
            y2="140"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="4 5"
          />
          <line
            x1="200"
            y1="150"
            x2="200"
            y2="266"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="4 5"
          />
        </svg>

        <div className="absolute left-1/2 top-[47%] z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative rounded-2xl border border-brand/30 bg-[#f0fdf4] px-5 py-3 text-center em-brand-glow">
            <span className="mx-auto grid size-7 place-items-center rounded-lg bg-brand/12 text-brand-ink">
              <Network className="size-3.5" aria-hidden="true" />
            </span>
            <span className="mt-1.5 block whitespace-nowrap text-[12px] font-semibold text-ink">
              {m.center}
            </span>
          </div>
        </div>

        {m.branches.map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onBranch(index)}
            aria-pressed={branch === index}
            className={cn(
              "absolute z-10 max-w-[112px] rounded-xl border px-2.5 py-2 text-center text-[10px] leading-tight transition-all duration-200 sm:max-w-[132px] sm:text-[10.5px]",
              positions[index],
              branch === index
                ? "border-brand/45 bg-brand/[0.1] text-ink shadow-[0_0_0_3px_rgba(5,150,105,0.06)]"
                : "border-hairline bg-surface-raised/90 text-ink-soft hover:border-brand/30 hover:text-ink"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-2 min-h-[62px] rounded-xl border border-hairline/70 bg-surface-deep p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {m.branches[branch].label}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          {m.branches[branch].detail}
        </p>
      </div>
    </div>
  );
}
