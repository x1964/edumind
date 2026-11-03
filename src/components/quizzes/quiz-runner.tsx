"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { submitQuizAction } from "@/lib/actions/library";
import type { AppMessages } from "@/lib/i18n/app";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizRunner({
  quizId,
  questions,
  dict,
}: {
  quizId: string;
  questions: QuizQuestion[];
  dict: AppMessages;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const question = questions[current];
  const answeredCount = useMemo(
    () => questions.filter((item) => (answers[item.id] ?? "").trim().length > 0).length,
    [answers, questions]
  );

  function setAnswer(value: string) {
    setAnswers((state) => ({ ...state, [question.id]: value }));
  }

  function submit() {
    if (answeredCount < questions.length) {
      setError(dict.quizzes.answerAll);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitQuizAction(quizId, answers);
      if (result.ok) {
        toast.success(result.message ?? dict.quizzes.submitted);
        router.push(`/dashboard/quizzes/${quizId}?attempt=${result.id ?? ""}`);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  if (!question) {
    return (
      <p className="rounded-2xl border border-dashed border-hairline px-5 py-10 text-center text-[12.5px] text-ink-muted">
        {dict.quizzes.notFound}
      </p>
    );
  }

  const progress = Math.round((answeredCount / questions.length) * 100);
  const options = question.type === "true_false" ? ["true", "false"] : (question.options ?? []);

  return (
    <div className="rounded-2xl border border-hairline bg-surface-raised/80">
      <div className="border-b border-hairline px-5 py-3.5">
        <div className="flex items-center justify-between gap-3 text-[11.5px] text-ink-muted">
          <span>
            {dict.quizzes.questionOf
              .replace("{current}", String(current + 1))
              .replace("{total}", String(questions.length))}
          </span>
          <span dir="ltr">{progress}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-brand-ink">
          {question.type === "multiple_choice"
            ? "MCQ"
            : question.type === "true_false"
              ? dict.quizzes.true + " / " + dict.quizzes.false
              : dict.quizzes.shortAnswerPlaceholder}
        </p>
        <h2 className="mt-2 break-words whitespace-pre-wrap text-[15px] font-semibold leading-relaxed text-ink [overflow-wrap:anywhere]">
          {question.prompt}
        </h2>

        <div className="mt-4 space-y-2">
          {question.type === "short_answer" ? (
            <input
              value={answers[question.id] ?? ""}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={dict.quizzes.shortAnswerPlaceholder}
              maxLength={500}
              className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink placeholder:text-ink-muted/70 focus:border-brand/50 focus:outline-none"
            />
          ) : (
            options.map((option) => {
              const selected = answers[question.id] === option;
              const label =
                question.type === "true_false"
                  ? option === "true"
                    ? dict.quizzes.true
                    : dict.quizzes.false
                  : option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswer(option)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-start text-[13px] transition-colors",
                    selected
                      ? "border-brand/50 bg-brand/[0.08] text-ink"
                      : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border",
                      selected ? "border-brand bg-brand text-[#04130c]" : "border-hairline-strong"
                    )}
                  >
                    {selected ? <Check className="size-3" aria-hidden="true" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                    {label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-[#ef4444]/25 bg-[#ef4444]/[0.06] px-3 py-2 text-[11.5px] text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-hairline/60 pt-4">
          <button
            type="button"
            onClick={() => setCurrent((value) => Math.max(value - 1, 0))}
            disabled={current === 0 || isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:invisible"
          >
            <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
            <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
            {dict.quizzes.previous}
          </button>

          {current < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((value) => Math.min(value + 1, questions.length - 1))}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-[12.5px] font-semibold text-[#04130c] transition-colors hover:bg-[#10b981]"
            >
              {dict.quizzes.next}
              <ArrowRight className="size-3.5 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="size-3.5 ltr:hidden" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-[12.5px] font-semibold text-[#04130c] transition-colors hover:bg-[#10b981] disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
              )}
              {isPending ? dict.quizzes.submitting : dict.quizzes.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
