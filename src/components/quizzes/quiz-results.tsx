import Link from "next/link";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppMessages } from "@/lib/i18n/app";
import type { QuizAttempt, QuizQuestion } from "@/lib/types";

function formatAnswer(value: string, type: QuizQuestion["type"], dict: AppMessages): string {
  if (!value) return dict.quizzes.noAnswer;
  if (type === "true_false") {
    return value === "true" ? dict.quizzes.true : dict.quizzes.false;
  }
  return value;
}

export function QuizResults({
  attempt,
  questions,
  quizId,
  dict,
}: {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  quizId: string;
  dict: AppMessages;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand/25 bg-brand/[0.07] p-4 sm:col-span-1">
          <p className="text-[12px] uppercase tracking-[0.12em] text-brand-ink">
            {dict.quizzes.score}
          </p>
          <p
            className="mt-1.5 text-[40px] font-semibold leading-none tracking-[-0.05em] text-ink"
            dir="auto"
          >
            {attempt.score}%
          </p>
          <p className="mt-2 text-[12px] text-ink-muted">
            {dict.quizzes.correct}: {attempt.correct_count} / {attempt.total_count}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-4">
            <p className="text-[12px] text-ink-muted">{dict.quizzes.totalQuestions}</p>
            <p className="mt-1 text-[22px] font-semibold text-ink" dir="auto">
              {attempt.total_count}
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-4">
            <p className="text-[12px] text-ink-muted">{dict.quizzes.correct}</p>
            <p className="mt-1 text-[22px] font-semibold text-brand-ink" dir="auto">
              {attempt.correct_count}
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-4">
            <p className="text-[12px] text-ink-muted">{dict.quizzes.incorrect}</p>
            <p className="mt-1 text-[22px] font-semibold text-danger" dir="auto">
              {attempt.total_count - attempt.correct_count}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-ink">{dict.quizzes.review}</h2>
        <Link
          href={`/dashboard/quizzes/${quizId}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04]"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {dict.quizzes.retake}
        </Link>
      </div>

      <ol className="space-y-2.5">
        {questions.map((question, index) => {
          const result = attempt.results.find((item) => item.questionId === question.id);
          const isCorrect = Boolean(result?.isCorrect);
          return (
            <li
              key={question.id}
              className={cn(
                "rounded-2xl border p-4",
                isCorrect
                  ? "border-brand/20 bg-brand/[0.035]"
                  : "border-[#ef4444]/20 bg-[#ef4444]/[0.035]"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full",
                    isCorrect ? "bg-brand/15 text-brand-ink" : "bg-[#ef4444]/15 text-danger"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="size-3.5" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">
                    {dict.common.questions} {index + 1}
                  </p>
                  <p className="mt-1 break-words whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-ink [overflow-wrap:anywhere]">
                    {question.prompt}
                  </p>

                  <div className="mt-2.5 grid gap-1.5 text-[12px] sm:grid-cols-2">
                    <div className="rounded-lg border border-hairline/70 bg-black/[0.02] px-2.5 py-1.5">
                      <span className="block text-[12px] uppercase tracking-wide text-ink-muted">
                        {dict.quizzes.yourAnswer}
                      </span>
                      <span className="block break-words text-ink-soft">
                        {formatAnswer(result?.given ?? "", question.type, dict)}
                      </span>
                    </div>
                    <div className="rounded-lg border border-hairline/70 bg-black/[0.02] px-2.5 py-1.5">
                      <span className="block text-[12px] uppercase tracking-wide text-ink-muted">
                        {dict.quizzes.correctAnswer}
                      </span>
                      <span className="block break-words text-brand-ink">
                        {formatAnswer(result?.correct ?? "", question.type, dict)}
                      </span>
                    </div>
                  </div>

                  {result?.explanation ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
                      <span className="font-medium text-ink-soft">
                        {dict.quizzes.explanation}:{" "}
                      </span>
                      {result.explanation}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
